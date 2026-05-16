"""ChromaDB vector store management service."""

import chromadb
from config import settings
from core.logging import get_logger
from typing import Optional, Any

logger = get_logger(__name__)

_client: Optional[Any] = None


def get_client() -> Any:
    """Get or create the ChromaDB client."""
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    return _client


def collection_name(session_id: str) -> str:
    """Get the Chroma collection name for a session."""
    return f"session_{session_id}"


def get_or_create_collection(session_id: str, embedding_function=None) -> chromadb.Collection:
    """Get or create a Chroma collection for a session."""
    client = get_client()
    name = collection_name(session_id)
    try:
        return client.get_collection(name)
    except (ValueError, Exception):
        return client.create_collection(
            name=name,
            metadata={"session_id": session_id},
        )


def add_chunks(
    session_id: str,
    chunks: list,
    embeddings: list[list[float]],
) -> None:
    """Upsert chunks into the session collection with metadata."""
    collection = get_or_create_collection(session_id)

    ids = [c.chunk_id for c in chunks]
    metadatas = [
        {
            "document_id": c.document_id,
            "session_id": session_id,
            "page_number": c.page_number or -1,
            "chunk_index": c.chunk_index,
            "text": c.text,
        }
        for c in chunks
    ]

    collection.add(
        ids=ids,
        embeddings=embeddings,  # type: ignore
        metadatas=metadatas,  # type: ignore
    )

    logger.info("chunks_indexed", count=len(chunks), session_id=session_id)


def delete_document_chunks(session_id: str, document_id: str) -> None:
    """Remove all chunks for a document from the session collection."""
    try:
        collection = get_or_create_collection(session_id)
        # Get all chunk IDs for this document
        results = collection.get(
            where={"document_id": document_id},
        )
        if results["ids"]:
            collection.delete(ids=results["ids"])
            logger.info("chunks_deleted", count=len(results["ids"]), document_id=document_id)
    except Exception as e:
        logger.error("chunks_deletion_failed", document_id=document_id, error=str(e))


def get_chunks_by_document_id(session_id: str, document_id: str) -> list[dict]:
    """Get all chunks for a specific document."""
    collection = get_or_create_collection(session_id)
    results = collection.get(
        where={"document_id": document_id},
        include=["metadatas", "documents"],
    )
    metadatas = results.get("metadatas") or []
    return [
        {
            "id": results["ids"][i],
            "metadata": metadatas[i] if i < len(metadatas) else {},
        }
        for i in range(len(results["ids"]))
    ]


def delete_session_collection(session_id: str) -> None:
    """Delete the entire session collection."""
    try:
        client = get_client()
        client.delete_collection(collection_name(session_id))
        logger.info("session_collection_deleted", session_id=session_id)
    except Exception as e:
        logger.error("session_collection_deletion_failed", session_id=session_id, error=str(e))
