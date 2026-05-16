"""Pydantic request/response schemas for documents."""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class DocumentSchema(BaseModel):
    """Document response schema."""

    id: str
    session_id: str
    file_name: str
    file_size: int
    file_type: str
    status: str
    chunk_count: Optional[int] = None
    page_count: Optional[int] = None
    uploaded_at: str  # ISO 8601
    processed_at: Optional[str] = None
    error_message: Optional[str] = None

    model_config = {"from_attributes": True}


class DocumentStatusSchema(BaseModel):
    """Document status response schema."""

    id: str
    status: str
    progress: float = 0.0
    error_message: Optional[str] = None


class DocumentListResponse(BaseModel):
    """Response for listing documents."""

    documents: list[DocumentSchema]


class DocumentResponse(BaseModel):
    """Response for a single document."""

    document: DocumentSchema


class DeleteResponse(BaseModel):
    """Response for deletion."""

    success: bool
