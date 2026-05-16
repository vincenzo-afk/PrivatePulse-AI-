"""Pydantic request/response schemas for chat."""

from pydantic import BaseModel, Field
from typing import Optional


class MessageSchema(BaseModel):
    """A single chat message."""

    role: str  # "user" | "assistant" | "system"
    content: str


class QueryRequest(BaseModel):
    """Request schema for chat query."""

    session_id: str
    question: str = Field(max_length=1000)
    document_ids: Optional[list[str]] = None
    conversation_history: Optional[list[MessageSchema]] = None


class Citation(BaseModel):
    """Inline citation from a retrieved chunk."""

    id: str
    document_id: str
    document_name: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    chunk_index: int
    relevance_score: float
    text_preview: str  # First 200 chars, masked


class SourceChunk(BaseModel):
    """Full source chunk shown in the sources panel."""

    chunk_id: str
    document_id: str
    document_name: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    text: str  # Full text, masked for UI
    relevance_score: float
    chunk_index: int


class PrivacySummary(BaseModel):
    """Privacy summary for a query response."""

    chunks_retrieved: int
    documents_accessed: list[str]
    raw_files_sent: bool = False


class QueryResponse(BaseModel):
    """Response schema for chat query."""

    answer: str
    citations: list[Citation]
    sources: list[SourceChunk]
    model_used: str
    tokens_used: dict
    processing_time_ms: int
    privacy_summary: PrivacySummary


class SessionSchema(BaseModel):
    """Session response schema."""

    id: str
    created_at: str
    last_active_at: str
    document_count: int = 0
    query_count: int = 0


class SessionResponse(BaseModel):
    """Response for a single session."""

    session: SessionSchema
    message_count: int


class SuggestedQuestionsResponse(BaseModel):
    """Response for suggested questions."""

    questions: list[str]


class DemoLoadRequest(BaseModel):
    """Request for loading demo documents."""

    session_id: str
    demo_set: str = "all"
