"""Text chunking service. Splits extracted text into overlapping chunks."""

import uuid
from dataclasses import dataclass, field
from langchain.text_splitter import RecursiveCharacterTextSplitter
from services.extraction import ExtractedDocument


from config import settings

SEPARATORS = ["\n\n", "\n", ". ", " ", ""]


@dataclass
class DocumentChunk:
    """A single chunk of text from a document."""
    chunk_id: str
    document_id: str
    text: str
    char_start: int
    char_end: int
    page_number: int | None
    section: str | None
    chunk_index: int


def chunk_document(extracted: ExtractedDocument, document_id: str) -> list[DocumentChunk]:
    """Split extracted text into overlapping chunks with page mapping.

    Uses LangChain RecursiveCharacterTextSplitter.
    Maps each chunk back to page_number using char_offset.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=SEPARATORS,
        length_function=len,
    )

    # Split the full text into chunks
    split_texts = splitter.split_text(extracted.text)

    # Track character positions for mapping back to pages
    chunks = []
    current_pos = 0

    for idx, chunk_text in enumerate(split_texts):
        # Find the actual start position in the original text
        start_pos = extracted.text.find(chunk_text, current_pos)
        if start_pos == -1:
            # Fallback: use cumulative position
            start_pos = current_pos
        end_pos = start_pos + len(chunk_text)
        current_pos = start_pos + len(chunk_text)

        # Map chunk to page number using char_offset
        page_number = None
        for page in extracted.pages:
            page_end = page.char_offset + len(page.text)
            if page.char_offset <= start_pos < page_end:
                page_number = page.page_num
                break

        chunk = DocumentChunk(
            chunk_id=str(uuid.uuid4()),
            document_id=document_id,
            text=chunk_text,
            char_start=start_pos,
            char_end=end_pos,
            page_number=page_number,
            section=None,
            chunk_index=idx,
        )
        chunks.append(chunk)

    return chunks
