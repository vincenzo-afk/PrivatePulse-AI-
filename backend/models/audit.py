"""AuditEvent SQLModel ORM model."""

from datetime import datetime
from sqlmodel import SQLModel, Field, Column, Text, DateTime, func
from typing import Optional


class AuditEvent(SQLModel, table=True):
    """Represents an auditable event in the system."""

    id: str = Field(primary_key=True, max_length=36)
    session_id: str = Field(max_length=36, index=True, nullable=False)
    event_type: str = Field(max_length=50, index=True, nullable=False)
    description: str = Field(max_length=1024, nullable=False)
    document_id: Optional[str] = Field(default=None, max_length=36)
    extra: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON blob
    created_at: datetime = Field(
        sa_column=Column(DateTime, server_default=func.now(), nullable=False)
    )
