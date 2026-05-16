"""Pydantic request/response schemas for audit."""

from pydantic import BaseModel
from typing import Optional


class AuditEventSchema(BaseModel):
    """Audit event response schema."""

    id: str
    session_id: str
    event_type: str
    description: str
    document_id: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: str

    model_config = {"from_attributes": True}


class AuditEventsResponse(BaseModel):
    """Paginated audit events response."""

    events: list[AuditEventSchema]
    total: int
    page: int
