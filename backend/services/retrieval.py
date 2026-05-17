"""Similarity retrieval service. Embeds query, searches Chroma, returns ranked chunks."""

from dataclasses import dataclass
from typing import Optional
from config import settings
from services.embedding import embed_query
from services.indexing import get_or_create_collection
from sqlmodel import Session as DBSession
from models.document import Document
from core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class RetrievedChunk:
    """A chunk retrieved from the vector store."""
    chunk_id: str
    document_id: str
    document_name: str
    text: str
    page_number: int | None
    relevance_score: float
    chunk_index: int


async def retrieve(
    session_id: str,
    query: str,
    document_ids: list[str] | None = None,
    db_session: Optional[DBSession] = None,
) -> list[RetrievedChunk]:
    """Retrieve relevant chunks for a query.

    1. Embed the query.
    2. Search Chroma collection (optionally filtered by document_ids).
    3. Filter results below MIN_RELEVANCE_SCORE.
    4. Return up to TOP_K ranked results.
    """
    # Get Chroma collection
    collection = get_or_create_collection(session_id)
    
    # Check if collection is empty - avoid embedding if no documents exist
    if collection.count() == 0:
        logger.info("retrieval_skipped_empty_collection", session_id=session_id)
        return []

    # Embed query
    query_embedding = await embed_query(query)

    # Build filter if document_ids provided
    where_filter = None
    if document_ids and len(document_ids) > 0:
        where_filter = {"document_id": {"$in": document_ids}}

    # Search
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=settings.top_k_retrieval * 2,  # Fetch extra for filtering
        where=where_filter,
        include=["metadatas", "distances"],
    )

    if not results["ids"] or len(results["ids"][0]) == 0:
        return []

    # Collect unique document IDs from results and build name lookup
    doc_ids_in_results = list(set(
        meta.get("document_id", "") for meta in results["metadatas"][0]
    ))
    doc_name_map = {}
    if db_session:
        try:
            docs = db_session.query(Document).filter(Document.id.in_(doc_ids_in_results)).all()
            doc_name_map = {doc.id: doc.file_name for doc in docs}
        except Exception:
            pass

    # Process results
    retrieved = []
    for i, chunk_id in enumerate(results["ids"][0]):
        metadata = results["metadatas"][0][i]
        distance = results["distances"][0][i]

        # Convert distance to similarity score (cosine similarity: 1 - distance)
        relevance_score = 1.0 - distance

        if relevance_score < settings.min_relevance_score:
            continue

        doc_id = metadata.get("document_id", "")
        doc_name = doc_name_map.get(doc_id, metadata.get("document_name", doc_id[:8] if doc_id else "Unknown"))

        chunk = RetrievedChunk(
            chunk_id=chunk_id,
            document_id=doc_id,
            document_name=doc_name,
            text=metadata.get("text", ""),
            page_number=metadata.get("page_number"),
            relevance_score=relevance_score,
            chunk_index=metadata.get("chunk_index", 0),
        )
        retrieved.append(chunk)

        if len(retrieved) >= settings.top_k_retrieval:
            break

    if not retrieved:
        # Fallback: If no chunks pass the similarity threshold, but there are documents,
        # retrieve the first chunks of those documents directly so the user can ask high-level queries/summaries!
        target_doc_ids = document_ids
        if not target_doc_ids and db_session:
            try:
                docs = db_session.query(Document).filter(Document.session_id == session_id).all()
                target_doc_ids = [d.id for d in docs]
            except Exception:
                pass
        
        # Build where filter if target_doc_ids exist
        fallback_where = None
        if target_doc_ids and len(target_doc_ids) > 0:
            fallback_where = {"document_id": {"$in": target_doc_ids}} if len(target_doc_ids) > 1 else {"document_id": target_doc_ids[0]}
            
        logger.info("retrieval_threshold_fallback_fetching_chunks", fallback_where=fallback_where)
        try:
            # Query Chroma directly for chunks
            fallback_results = collection.get(
                where=fallback_where,
                limit=settings.top_k_retrieval,
                include=["metadatas"]
            )
            if fallback_results["ids"]:
                # Build doc name map for fallback if not already done
                if not doc_name_map and db_session and target_doc_ids:
                    try:
                        docs = db_session.query(Document).filter(Document.id.in_(target_doc_ids)).all()
                        doc_name_map = {doc.id: doc.file_name for doc in docs}
                    except Exception:
                        pass
                
                for i, chunk_id in enumerate(fallback_results["ids"]):
                    metadata = fallback_results["metadatas"][i]
                    doc_id = metadata.get("document_id", "")
                    doc_name = doc_name_map.get(doc_id, metadata.get("document_name", doc_id[:8] if doc_id else "Unknown"))
                    retrieved.append(RetrievedChunk(
                        chunk_id=chunk_id,
                        document_id=doc_id,
                        document_name=doc_name,
                        text=metadata.get("text", ""),
                        page_number=metadata.get("page_number") if metadata.get("page_number") != -1 else None,
                        relevance_score=1.0,  # perfect fallback score
                        chunk_index=metadata.get("chunk_index", 0),
                    ))
        except Exception as fallback_err:
            logger.error("fallback_retrieval_failed", error=str(fallback_err))

    logger.info(
        "retrieval_complete",
        query_length=len(query),
        chunks_retrieved=len(retrieved),
        session_id=session_id,
    )

    return retrieved
