"""UserSession SQLModel ORM model."""

from datetime import datetime
from sqlmodel import SQLModel, Field, Column, DateTime, func


class UserSession(SQLModel, table=True):
    """Represents a user session."""

    id: str = Field(primary_key=True, max_length=36)
    created_at: datetime = Field(
        sa_column=Column(DateTime, server_default=func.now(), nullable=False)
    )
    last_active_at: datetime = Field(
        sa_column=Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    )
    document_count: int = Field(default=0)
    query_count: int = Field(default=0)
