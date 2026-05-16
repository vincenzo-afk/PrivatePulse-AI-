"""Services package init. Re-exports all service functions."""

from .extraction import extract, ExtractedDocument, PageContent, extract_with_vision
from .chunking import chunk_document, DocumentChunk
from .embedding import embed_texts, embed_query
from .indexing import get_or_create_collection, add_chunks, delete_document_chunks
from .retrieval import retrieve, RetrievedChunk
from .generation import generate_answer, GeneratedAnswer
from .masking import mask_text, MaskedText, MaskedEntity
from .audit import log_event, AuditEventType

__all__ = [
    "extract", "ExtractedDocument", "PageContent", "extract_with_vision",
    "chunk_document", "DocumentChunk",
    "embed_texts", "embed_query",
    "get_or_create_collection", "add_chunks", "delete_document_chunks",
    "retrieve", "RetrievedChunk",
    "generate_answer", "GeneratedAnswer",
    "mask_text", "MaskedText", "MaskedEntity",
    "log_event", "AuditEventType",
]
