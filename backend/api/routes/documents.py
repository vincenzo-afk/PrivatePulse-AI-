"""Document management API routes."""

import uuid
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, Query
from sqlmodel import Session as DBSession, select
from config import settings
from models.database import get_session
from models.document import Document, DocumentChunk
from models.session import UserSession
from schemas.document import (
    DocumentSchema,
    DocumentStatusSchema,
    DocumentListResponse,
    DocumentResponse,
    DeleteResponse,
)
from services.extraction import extract
from services.chunking import chunk_document
from services.embedding import embed_texts
from services.indexing import add_chunks, delete_document_chunks
from services.audit import log_event, AuditEventType
from core.exceptions import InvalidFileTypeError, FileTooLargeError, DocumentNotFoundError
from core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/documents")


ALLOWED_EXTENSIONS = {"pdf", "txt", "docx"}


def validate_file(file: UploadFile) -> tuple[str, str]:
    """Validate file type and size. Returns (extension, filename)."""
    filename = file.filename or "unknown"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise InvalidFileTypeError(ext, list(ALLOWED_EXTENSIONS))

    return ext, filename


async def process_document_background(
    document_id: str,
    file_path: Path,
    file_type: str,
    session_id: str,
):
    """Background task: extract, chunk, embed, and index a document.
    
    Creates its OWN database session since the request session is closed
    by the time this background task runs.
    """
    from models.database import engine
    
    with DBSession(engine) as db:
        try:
            # Step 1: Update status to processing
            doc = db.get(Document, document_id)
            if doc:
                doc.status = "processing"
                db.add(doc)
                db.commit()

            # Step 2: Extract text
            extracted = await extract(file_path, file_type)

            await log_event(
                session_id, AuditEventType.DOCUMENT_EXTRACTED,
                f"Extracted {extracted.char_count} chars from {doc.file_name if doc else 'unknown'}",
                document_id=document_id, db_session=db,
                metadata={"page_count": extracted.page_count, "char_count": extracted.char_count},
            )

            # Step 3: Chunk
            chunks = chunk_document(extracted, document_id)

            await log_event(
                session_id, AuditEventType.DOCUMENT_CHUNKED,
                f"Created {len(chunks)} chunks from {doc.file_name if doc else 'unknown'}",
                document_id=document_id, db_session=db,
                metadata={"chunk_count": len(chunks)},
            )

            # Step 4: Save chunks to SQLite
            for chunk in chunks:
                db_chunk = DocumentChunk(
                    id=chunk.chunk_id,
                    document_id=document_id,
                    session_id=session_id,
                    text=chunk.text,
                    char_start=chunk.char_start,
                    char_end=chunk.char_end,
                    page_number=chunk.page_number,
                    section=chunk.section,
                    chunk_index=chunk.chunk_index,
                )
                db.add(db_chunk)
            db.commit()

            # Step 5: Generate embeddings
            embeddings = await embed_texts([c.text for c in chunks])

            await log_event(
                session_id, AuditEventType.DOCUMENT_EMBEDDED,
                f"Generated {len(embeddings)} embeddings for {doc.file_name if doc else 'unknown'}",
                document_id=document_id, db_session=db,
                metadata={"embedding_count": len(embeddings), "model": settings.embedding_model},
            )

            # Step 6: Index in Chroma
            add_chunks(session_id, chunks, embeddings)

            # Step 7: Update status to ready
            if doc:
                doc.status = "ready"
                doc.chunk_count = len(chunks)
                doc.page_count = extracted.page_count
                doc.char_count = extracted.char_count
                doc.processed_at = datetime.now(timezone.utc)
                db.add(doc)
                db.commit()

            logger.info("document_processed", document_id=document_id, chunks=len(chunks))

        except Exception as e:
            logger.exception(f"Failed to process document {document_id}")
            doc = db.get(Document, document_id)
            if doc:
                doc.status = "error"
                doc.error_message = str(e)
                db.add(doc)
                db.commit()

            await log_event(
                session_id, AuditEventType.DOCUMENT_UPLOADED,
                f"Processing failed for {doc.file_name}: {str(e)[:200]}",
                document_id=document_id, db_session=db,
            )


@router.post("/upload", response_model=DocumentListResponse)
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    session_id: str = Query(default=""),
    db: DBSession = Depends(get_session),
):
    """Upload one or more documents for processing."""
    documents = []

    for file in files:
        # Validate file
        ext, filename = validate_file(file)

        # Read file content
        content = await file.read()
        if len(content) > settings.max_upload_bytes:
            raise FileTooLargeError(len(content) // (1024 * 1024), settings.max_upload_size_mb)

        # Create document record
        document_id = str(uuid.uuid4())
        upload_dir = Path(settings.upload_dir) / session_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / f"{document_id}.{ext}"

        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(content)

        # Create DB record
        doc = Document(
            id=document_id,
            session_id=session_id,
            file_name=filename,
            file_path=str(file_path),
            file_size=len(content),
            file_type=ext,
            status="pending",
            uploaded_at=datetime.now(timezone.utc),
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Ensure session exists
        existing_session = db.get(UserSession, session_id)
        if not existing_session:
            db.add(UserSession(id=session_id))
        else:
            existing_session.document_count += 1
            existing_session.last_active_at = datetime.now(timezone.utc)
        db.commit()

        await log_event(
            session_id, AuditEventType.DOCUMENT_UPLOADED,
            f"Uploaded {filename} ({len(content)} bytes)",
            document_id=document_id, db_session=db,
            metadata={"file_size": len(content), "file_type": ext},
        )

        # Background processing (creates its own DB session)
        background_tasks.add_task(
            process_document_background,
            document_id, file_path, ext, session_id,
        )

        documents.append(DocumentSchema.model_validate(doc))

    return DocumentListResponse(documents=documents)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    session_id: str = Query(default=""),
    db: DBSession = Depends(get_session),
):
    """List all documents for a session."""
    docs = db.exec(select(Document).where(
        Document.session_id == session_id
    ).order_by(Document.uploaded_at.desc())).all()

    return DocumentListResponse(
        documents=[DocumentSchema.model_validate(d) for d in docs]
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: DBSession = Depends(get_session),
):
    """Get a single document by ID."""
    doc = db.get(Document, document_id)
    if not doc:
        raise DocumentNotFoundError(document_id)
    return DocumentResponse(document=DocumentSchema.model_validate(doc))


@router.get("/{document_id}/status", response_model=DocumentStatusSchema)
async def get_document_status(
    document_id: str,
    db: DBSession = Depends(get_session),
):
    """Get document processing status."""
    doc = db.get(Document, document_id)
    if not doc:
        raise DocumentNotFoundError(document_id)

    progress = {"pending": 0.0, "processing": 0.5, "ready": 1.0, "error": 0.0}.get(doc.status, 0.0)

    return DocumentStatusSchema(
        id=doc.id,
        status=doc.status,
        progress=progress,
        error_message=doc.error_message,
    )


@router.delete("/{document_id}", response_model=DeleteResponse)
async def delete_document(
    document_id: str,
    session_id: str = Query(default=""),
    db: DBSession = Depends(get_session),
):
    """Delete a document and its chunks."""
    doc = db.get(Document, document_id)
    if not doc:
        raise DocumentNotFoundError(document_id)

    # Delete from Chroma
    delete_document_chunks(session_id, document_id)

    # Delete chunks from SQLite
    from sqlmodel import delete as sql_delete
    db.exec(sql_delete(DocumentChunk).where(DocumentChunk.document_id == document_id))

    # Delete file from disk
    try:
        Path(doc.file_path).unlink(missing_ok=True)
    except Exception as e:
        logger.warning("file_deletion_failed", path=doc.file_path, error=str(e))

    # Delete document record
    db.delete(doc)
    db.commit()

    # Update session document count
    session = db.get(UserSession, session_id)
    if session and session.document_count > 0:
        session.document_count -= 1
        db.commit()

    await log_event(
        session_id, AuditEventType.DOCUMENT_DELETED,
        f"Deleted {doc.file_name}",
        document_id=document_id, db_session=db,
    )

    return DeleteResponse(success=True)
