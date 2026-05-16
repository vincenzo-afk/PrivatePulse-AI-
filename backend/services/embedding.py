"""Embedding service. Converts text to vector representations.

Supports both Ollama (local, default) and OpenAI (cloud) providers.
"""

import asyncio
import httpx
from typing import Optional
from config import settings
from core.exceptions import EmbeddingError
from core.logging import get_logger

logger = get_logger(__name__)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of text strings.

    Returns list of embedding vectors in the same order as input texts.
    Uses Ollama by default, falls back to OpenAI if configured.
    Handles rate limiting with exponential backoff (max 3 retries).
    """
    if settings.embedding_provider == "ollama":
        return await _embed_with_ollama(texts)
    else:
        return await _embed_with_openai(texts)


async def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    if settings.embedding_provider == "ollama":
        return await _embed_single_ollama(query)
    else:
        return await _embed_single_openai(query)


async def _embed_with_ollama(texts: list[str]) -> list[list[float]]:
    """Embed texts using Ollama API."""
    all_embeddings = []
    batch_size = 100

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        retries = 0
        max_retries = 3

        while retries < max_retries:
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        f"{settings.ollama_base_url}/api/embeddings",
                        json={
                            "model": settings.ollama_embedding_model,
                            "prompt": "\n\n".join(batch),
                        },
                    )
                    response.raise_for_status()
                    data = response.json()
                    embedding = data.get("embedding", [])
                    all_embeddings.append(embedding)
                    break
            except Exception as e:
                retries += 1
                if retries >= max_retries:
                    raise EmbeddingError(
                        f"Failed to embed texts with Ollama after {max_retries} retries: {e}"
                    )
                wait_time = 2**retries
                logger.warning(
                    "ollama_embedding_retry",
                    retry=retries,
                    wait=wait_time,
                    error=str(e),
                )
                await asyncio.sleep(wait_time)

    logger.info(
        "embeddings_generated_ollama",
        count=len(all_embeddings),
        model=settings.ollama_embedding_model,
    )
    return all_embeddings


async def _embed_single_ollama(query: str) -> list[float]:
    """Embed a single query using Ollama API."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.ollama_base_url}/api/embeddings",
                json={
                    "model": settings.ollama_embedding_model,
                    "prompt": query,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("embedding", [])
    except Exception as e:
        raise EmbeddingError(f"Failed to embed query with Ollama: {e}")


async def _embed_with_openai(texts: list[str]) -> list[list[float]]:
    """Embed texts using OpenAI API."""
    from openai import AsyncOpenAI

    if not settings.openai_api_key:
        raise EmbeddingError(
            "OpenAI API key not configured. Set OPENAI_API_KEY in .env or use Ollama."
        )

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    batch_size = 100
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
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
                    raise EmbeddingError(
                        f"Failed to embed texts with OpenAI after {max_retries} retries: {e}"
                    )
                wait_time = 2**retries
                logger.warning(
                    "openai_embedding_retry",
                    retry=retries,
                    wait=wait_time,
                    error=str(e),
                )
                await asyncio.sleep(wait_time)

    logger.info(
        "embeddings_generated_openai",
        count=len(all_embeddings),
        model=settings.embedding_model,
    )
    return all_embeddings


async def _embed_single_openai(query: str) -> list[float]:
    """Embed a single query using OpenAI API."""
    from openai import AsyncOpenAI

    if not settings.openai_api_key:
        raise EmbeddingError("OpenAI API key not configured")

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    try:
        response = await client.embeddings.create(
            model=settings.embedding_model,
            input=[query],
        )
        return response.data[0].embedding
    except Exception as e:
        raise EmbeddingError(f"Failed to embed query with OpenAI: {e}")
