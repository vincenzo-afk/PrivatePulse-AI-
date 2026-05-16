"""Document and DocumentChunk SQLModel ORM models."""

from datetime import datetime
from sqlmodel import SQLModel, Field, Column, Integer, Text, DateTime, func
from typing import Optional


class Document(SQLModel, table=True):
    """Represents an uploaded document."""

    id: str = Field(primary_key=True, max_length=36)
    session_id: str = Field(max_length=36, index=True, nullable=False)
    file_name: str = Field(max_length=255, nullable=False)
    file_path: str = Field(max_length=1024, nullable=False)
    file_size: int = Field(nullable=False)  # bytes
    file_type: str = Field(max_length=10, nullable=False)  # "pdf" | "txt" | "docx"
    status: str = Field(default="pending", max_length=20)  # pending | processing | ready | error
    chunk_count: Optional[int] = Field(default=None)
    page_count: Optional[int] = Field(default=None)
    char_count: Optional[int] = Field(default=None)
    uploaded_at: datetime = Field(
        sa_column=Column(DateTime, server_default=func.now(), nullable=False)
    )
    processed_at: Optional[datetime] = Field(default=None)
    error_message: Optional[str] = Field(default=None, max_length=1024)


class DocumentChunk(SQLModel, table=True):
    """Represents a chunk of text from a document."""

    id: str = Field(primary_key=True, max_length=36)
    document_id: str = Field(max_length=36, foreign_key="document.id", nullable=False)
    session_id: str = Field(max_length=36, index=True, nullable=False)
    text: str = Field(sa_column=Column(Text, nullable=False))
    char_start: int = Field(nullable=False)
    char_end: int = Field(nullable=False)
    page_number: Optional[int] = Field(default=None)
    section: Optional[str] = Field(default=None, max_length=255)
    chunk_index: int = Field(nullable=False)
    created_at: datetime = Field(
        sa_column=Column(DateTime, server_default=func.now(), nullable=False)
    )
