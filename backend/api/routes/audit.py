"""Audit log retrieval API routes."""

import json
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session as DBSession, select, func
from models.database import get_session
from models.audit import AuditEvent
from schemas.audit import AuditEventSchema, AuditEventsResponse

router = APIRouter(prefix="/audit")


@router.get("/events", response_model=AuditEventsResponse)
async def get_audit_events(
    session_id: str = Query(default=""),
    event_type: str = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    from_date: str = Query(default=None, alias="from"),
    to_date: str = Query(default=None, alias="to"),
    db: DBSession = Depends(get_session),
):
    """Get paginated audit events with optional filters."""
    query = select(AuditEvent).where(AuditEvent.session_id == session_id)

    if event_type:
        query = query.where(AuditEvent.event_type == event_type)

    if from_date:
        query = query.where(AuditEvent.created_at >= from_date)

    if to_date:
        query = query.where(AuditEvent.created_at <= to_date)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = db.exec(count_query).one()

    # Get paginated results
    query = query.order_by(AuditEvent.created_at.desc())
    query = query.offset(offset).limit(limit)
    events = db.exec(query).all()

    event_schemas = []
    for event in events:
        metadata = None
        if event.metadata:
            try:
                metadata = json.loads(event.metadata)
            except (json.JSONDecodeError, TypeError):
                metadata = None

        event_schemas.append(AuditEventSchema(
            id=event.id,
            session_id=event.session_id,
            event_type=event.event_type,
            description=event.description,
            document_id=event.document_id,
            metadata=metadata,
            created_at=event.created_at.isoformat(),
        ))

    return AuditEventsResponse(
        events=event_schemas,
        total=total,
        page=(offset // limit) + 1 if limit > 0 else 1,
    )
