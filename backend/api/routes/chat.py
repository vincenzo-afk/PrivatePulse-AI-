"""Chat API routes - query, sessions, suggested questions.
Supports optional image uploads for multimodal (vision) queries via Groq."""

import json
import base64
import time
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Form, File, UploadFile, Request
from sqlmodel import Session as DBSession
from models.database import get_session
from models.session import UserSession
from models.document import Document
from schemas.chat import (
    QueryResponse,
    Citation,
    SourceChunk,
    PrivacySummary,
    SessionResponse,
    SessionSchema,
    SuggestedQuestionsResponse,
    MessageSchema,
)
from services.retrieval import retrieve
from services.generation import generate_answer
from services.masking import mask_text_short
from services.audit import log_event, AuditEventType
from core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/chat/query", response_model=QueryResponse)
async def chat_query(
    request: Request,
    question: str = Form(...),
    session_id: str = Form(...),
    document_ids: Optional[str] = Form(None),
    conversation_history: Optional[str] = Form(None),
    images: Optional[list[UploadFile]] = File(None),
    db: DBSession = Depends(get_session),
):
    """Process a chat query against the session's documents.

    Accepts multipart/form-data with optional image uploads for vision queries.

    Supports:
    - Text-only queries
    - Multimodal queries with image attachments
    """
    start_time = time.time()

    # Parse optional JSON fields from form data
    doc_ids = json.loads(document_ids) if document_ids else None
    history = None
    if conversation_history:
        history_raw = json.loads(conversation_history)
        history = [MessageSchema(**m) for m in history_raw]

    # Handle uploaded images - convert to base64 data URLs for the vision model
    image_urls = []
    if images:
        for img in images:
            if img.filename:
                content_type = img.content_type or ""
                if not content_type.startswith("image/"):
                    continue
                img_data = await img.read()
                if len(img_data) > 4 * 1024 * 1024:  # 4MB limit per image
                    logger.warning("image_too_large", filename=img.filename, size=len(img_data))
                    continue
                ext = content_type.split("/")[-1] if "/" in content_type else "png"
                base64_img = base64.b64encode(img_data).decode("utf-8")
                image_urls.append(f"data:image/{ext};base64,{base64_img}")

    if len(image_urls) > 5:
        logger.warning("too_many_images", count=len(image_urls))
        image_urls = image_urls[:5]  # Groq vision limit

    # Log query received
    await log_event(
        session_id, AuditEventType.QUERY_RECEIVED,
        f"Query: {question[:100]}",
        metadata={"question_length": len(question), "image_count": len(image_urls)},
    )

    # Update session query count and last active
    session = db.get(UserSession, session_id)
    if session:
        session.query_count += 1
        session.last_active_at = datetime.utcnow()
        db.commit()

    # Retrieve relevant chunks
    retrieved_chunks = await retrieve(
        session_id=session_id,
        query=question,
        document_ids=doc_ids,
        db_session=db,
    )

    # Log retrieval
    await log_event(
        session_id, AuditEventType.RETRIEVAL_EXECUTED,
        f"Retrieved {len(retrieved_chunks)} chunks",
        metadata={
            "chunk_count": len(retrieved_chunks),
            "scores": [round(c.relevance_score, 3) for c in retrieved_chunks],
        },
    )

    # Handle no-context case (no chunks AND no images)
    if not retrieved_chunks and not image_urls:
        processing_time = int((time.time() - start_time) * 1000)
        return QueryResponse(
            answer="I couldn't find any relevant information in your documents to answer this question.",
            citations=[],
            sources=[],
            model_used="none",
            tokens_used={"input": 0, "output": 0},
            processing_time_ms=processing_time,
            privacy_summary=PrivacySummary(
                chunks_retrieved=0,
                documents_accessed=[],
                raw_files_sent=False,
            ),
        )

    # Generate answer (with optional images for vision)
    generated = await generate_answer(
        question=question,
        chunks=retrieved_chunks,
        conversation_history=history,
        image_urls=image_urls,
    )

    # Log answer generated
    await log_event(
        session_id, AuditEventType.ANSWER_GENERATED,
        f"Answer generated using {len(retrieved_chunks)} sources",
        metadata={
            "tokens": generated.tokens_used,
            "model": generated.model_used,
        },
    )

    # Build citations with masked previews
    citations = [
        Citation(
            id=c.chunk_id,
            document_id=c.document_id,
            document_name=c.document_name,
            page_number=c.page_number if c.page_number and c.page_number > 0 else None,
            section=None,
            chunk_index=c.chunk_index,
            relevance_score=round(c.relevance_score, 3),
            text_preview=mask_text_short(c.text[:200]),
        )
        for c in retrieved_chunks
    ]

    sources = [
        SourceChunk(
            chunk_id=c.chunk_id,
            document_id=c.document_id,
            document_name=c.document_name,
            page_number=c.page_number if c.page_number and c.page_number > 0 else None,
            section=None,
            text=mask_text_short(c.text),
            relevance_score=round(c.relevance_score, 3),
            chunk_index=c.chunk_index,
        )
        for c in retrieved_chunks
    ]

    processing_time = int((time.time() - start_time) * 1000)

    return QueryResponse(
        answer=generated.text,
        citations=citations,
        sources=sources,
        model_used=generated.model_used,
        tokens_used=generated.tokens_used,
        processing_time_ms=processing_time,
        privacy_summary=PrivacySummary(
            chunks_retrieved=len(retrieved_chunks),
            documents_accessed=list(set(c.document_name for c in retrieved_chunks)),
            raw_files_sent=False,
        ),
    )


@router.get("/chat/sessions/{session_id}", response_model=SessionResponse)
async def get_session_info(
    session_id: str,
    db: DBSession = Depends(get_session),
):
    """Get session information and message count."""
    session = db.get(UserSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(
        session=SessionSchema(
            id=session.id,
            created_at=session.created_at.isoformat(),
            last_active_at=session.last_active_at.isoformat(),
            document_count=session.document_count,
            query_count=session.query_count,
        ),
        message_count=0,
    )


@router.get("/chat/suggested-questions", response_model=SuggestedQuestionsResponse)
async def get_suggested_questions(
    session_id: str = Query(default=""),
    db: DBSession = Depends(get_session),
):
    """Get suggested questions based on the user's documents."""
    docs = db.query(Document).filter(
        Document.session_id == session_id,
        Document.status == "ready",
    ).all()

    if not docs:
        return SuggestedQuestionsResponse(questions=[])

    all_questions = []
    file_names = [d.file_name.lower() for d in docs]

    questions_map = {
        "medical": [
            "What medications is the patient taking?",
            "What are the key lab results?",
            "Summarize the doctor's recommendations.",
            "When is the next follow-up appointment?",
            "What diagnoses are documented?",
        ],
        "financial": [
            "What was the total revenue this quarter?",
            "What are the main expense categories?",
            "Is the company profitable?",
            "What does the auditor say?",
            "What are the cash flow trends?",
        ],
        "contract": [
            "What are the payment terms?",
            "How can this contract be terminated?",
            "What is the confidentiality clause?",
            "What law governs this agreement?",
            "What are the key obligations of each party?",
        ],
    }

    for fname in file_names:
        for key, questions in questions_map.items():
            if key in fname:
                all_questions.extend(questions)

    seen = set()
    unique_questions = []
    for q in all_questions:
        if q not in seen:
            seen.add(q)
            unique_questions.append(q)

    if not unique_questions:
        unique_questions = [
            "Summarize the key information in my documents.",
            "What are the important dates mentioned?",
            "List all parties or entities mentioned.",
            "What are the key terms and conditions?",
            "Are there any risks I should be aware of?",
            "Provide a detailed summary of all documents.",
        ]

    return SuggestedQuestionsResponse(questions=unique_questions[:6])
