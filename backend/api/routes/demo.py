"""Demo document loading API routes."""

import uuid
import shutil
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlmodel import Session as DBSession
from config import settings
from models.database import get_session
from models.document import Document
from models.session import UserSession
from schemas.document import DocumentSchema, DocumentListResponse
from api.routes.documents import process_document_background
from services.audit import log_event, AuditEventType
from core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/demo")


@router.post("/load", response_model=DocumentListResponse)
async def load_demo_documents(
    background_tasks: BackgroundTasks,
    session_id: str,
    demo_set: str = "all",
    db: DBSession = Depends(get_session),
):
    """Load demo documents from the demo_documents directory."""
    demo_dir = Path(__file__).parent.parent.parent / "data" / "demo_documents"
    if not demo_dir.exists():
        raise HTTPException(status_code=500, detail="Demo documents directory not found")

    # Map demo sets to files - support both .txt and .pdf
    demo_files_map = {
        "medical": ["medical-report-sample.txt", "medical-report-sample.pdf"],
        "financial": ["financial-statement-sample.txt", "financial-statement-sample.pdf"],
        "legal": ["contract-sample.txt", "contract-sample.pdf"],
        "all": [
            "medical-report-sample.txt", "medical-report-sample.pdf",
            "financial-statement-sample.txt", "financial-statement-sample.pdf",
            "contract-sample.txt", "contract-sample.pdf",
        ],
    }

    candidate_files = demo_files_map.get(demo_set, demo_files_map["all"])
    # Use only files that actually exist
    selected_files = []
    for f in candidate_files:
        if (demo_dir / f).exists():
            selected_files.append(f)

    if not selected_files:
        # Try to find any text files in the demo directory
        selected_files = [f.name for f in demo_dir.iterdir() if f.suffix in (".txt", ".pdf")]
        if not selected_files:
            raise HTTPException(status_code=500, detail="No demo documents found")

    # Ensure session exists
    existing_session = db.get(UserSession, session_id)
    if not existing_session:
        existing_session = UserSession(id=session_id)
        db.add(existing_session)
    else:
        existing_session.document_count += len(selected_files)
        existing_session.last_active_at = datetime.utcnow()
    db.commit()

    # Ensure upload directory exists
    upload_dir = Path(settings.upload_dir) / session_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    documents = []

    for filename in selected_files:
        source_path = demo_dir / filename
        if not source_path.exists():
            logger.warning("demo_file_not_found", path=str(source_path))
            continue

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"
        document_id = str(uuid.uuid4())
        dest_path = upload_dir / f"{document_id}.{ext}"

        # Copy file
        shutil.copy2(source_path, dest_path)

        # Get file size
        file_size = dest_path.stat().st_size

        # Create document record
        doc = Document(
            id=document_id,
            session_id=session_id,
            file_name=filename,
            file_path=str(dest_path),
            file_size=file_size,
            file_type=ext,
            status="pending",
            uploaded_at=datetime.utcnow(),
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Background processing
        background_tasks.add_task(
            process_document_background,
            document_id, dest_path, ext, session_id,
        )

        documents.append(DocumentSchema.model_validate(doc))

    await log_event(
        session_id, AuditEventType.DEMO_LOADED,
        f"Loaded {len(documents)} demo documents ({demo_set})",
        db_session=db,
        metadata={"demo_set": demo_set, "file_count": len(documents)},
    )

    return DocumentListResponse(documents=documents)
