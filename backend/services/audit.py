"""Audit logging service. Records every significant operation with full context."""

import uuid
import json
from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import Session as DBSession
from models.audit import AuditEvent
from core.logging import get_logger

logger = get_logger(__name__)


class AuditEventType(str, Enum):
    """Enum of all audit event types."""
    DOCUMENT_UPLOADED = "document.uploaded"
    DOCUMENT_EXTRACTED = "document.extracted"
    DOCUMENT_CHUNKED = "document.chunked"
    DOCUMENT_EMBEDDED = "document.embedded"
    DOCUMENT_DELETED = "document.deleted"
    QUERY_RECEIVED = "query.received"
    RETRIEVAL_EXECUTED = "retrieval.executed"
    ANSWER_GENERATED = "answer.generated"
    DEMO_LOADED = "demo.loaded"


async def log_event(
    session_id: str,
    event_type: AuditEventType,
    description: str,
    document_id: str | None = None,
    metadata: dict | None = None,
    db_session: Optional[DBSession] = None,
) -> AuditEvent:
    """Create and persist an AuditEvent record.

    If db_session is provided, saves immediately.
    Otherwise, just logs the event.
    """
    event = AuditEvent(
        id=str(uuid.uuid4()),
        session_id=session_id,
        event_type=event_type.value,
        description=description,
        document_id=document_id,
        metadata=json.dumps(metadata) if metadata else None,
    )

    if db_session:
        try:
            db_session.add(event)
            db_session.commit()
        except Exception as e:
            db_session.rollback()
            logger.error("audit_log_failed", event_type=event_type.value, error=str(e))

    logger.info(
        "audit_event",
        event_type=event_type.value,
        session_id=session_id,
        document_id=document_id,
    )

    return event
