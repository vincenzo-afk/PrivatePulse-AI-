"""Embedding service. Converts text to vector representations."""

import asyncio
import time
from typing import Optional
from openai import AsyncOpenAI
from config import settings
from core.exceptions import EmbeddingError
from core.logging import get_logger

logger = get_logger(__name__)

_client: Optional[AsyncOpenAI] = None
_EMBEDDING_DIMENSIONS = 1536


def get_client() -> AsyncOpenAI:
    """Get or create the OpenAI client."""
    global _client
    if _client is None:
        api_key = settings.openai_api_key
        if not api_key:
            raise EmbeddingError("OpenAI API key not configured")
        _client = AsyncOpenAI(api_key=api_key)
    return _client


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of text strings.

    Returns list of embedding vectors in the same order as input texts.
    Handles rate limiting with exponential backoff (max 3 retries).
    """
    client = get_client()
    batch_size = 100
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        retries = 0
        max_retries = 3

        while retries < max_retries:
            try:
                response = await client.embeddings.create(
                    model=settings.embedding_model,
                    input=batch,
                )
                embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(embeddings)
                break
            except Exception as e:
                retries += 1
                if retries >= max_retries:
                    raise EmbeddingError(f"Failed to embed texts after {max_retries} retries: {e}")
                wait_time = 2 ** retries
                logger.warning("embedding_retry", retry=retries, wait=wait_time, error=str(e))
                await asyncio.sleep(wait_time)

    logger.info("embeddings_generated", count=len(all_embeddings), model=settings.embedding_model)
    return all_embeddings


async def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    client = get_client()
    try:
        response = await client.embeddings.create(
            model=settings.embedding_model,
            input=[query],
        )
        return response.data[0].embedding
    except Exception as e:
        raise EmbeddingError(f"Failed to embed query: {e}")
