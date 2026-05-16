"""LLM answer generation service. Builds RAG prompt and calls Groq API (OpenAI-compatible)."""

import re
import json
from dataclasses import dataclass, field
from typing import Optional

import httpx

from config import settings
from core.exceptions import GenerationError, GroqAPIError, GroqRateLimitError, GroqContextLengthError
from core.logging import get_logger
from schemas.chat import MessageSchema
from services.retrieval import RetrievedChunk

logger = get_logger(__name__)


SYSTEM_PROMPT = """You are PrivatePulse, a private document intelligence assistant.
You answer questions ONLY based on the provided document excerpts.

Rules:
- If the documents do not contain enough information to answer confidently, say: "I couldn't find enough information in your documents to answer this question."
- Always cite your sources using [1], [2], etc. corresponding to the provided excerpts.
- Keep answers concise, accurate, and professional.
- Never fabricate information. Never guess.
- Never refer to yourself as an AI model from any specific company.
- When citing, place the citation marker right after the relevant statement."""


@dataclass
class GeneratedAnswer:
    """Result of LLM answer generation."""
    text: str
    citations: list[int] = field(default_factory=list)
    model_used: str = ""
    tokens_used: dict = field(default_factory=lambda: {"input": 0, "output": 0})
    raw_response: Optional[dict] = None


def build_messages(
    question: str,
    chunks: list[RetrievedChunk],
    conversation_history: Optional[list[MessageSchema]] = None,
    image_urls: Optional[list[str]] = None,
) -> list[dict]:
    """Build the messages array for the Groq API (OpenAI-compatible format).

    Injects conversation history as proper message objects so the model
    sees the full dialogue context, not just a flattened text block.
    Supports text-only and multimodal (text + images) inputs.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Inject conversation history as message objects
    if conversation_history:
        for msg in conversation_history[-6:]:
            messages.append({
                "role": msg.role,
                "content": msg.content,
            })

    # Build document excerpts section
    excerpts_parts = []
    for i, chunk in enumerate(chunks, 1):
        source_ref = f"[{i}] Source: {chunk.document_name}"
        if chunk.page_number is not None and chunk.page_number > 0:
            source_ref += f", Page {chunk.page_number}"
        excerpts_parts.append(f"{source_ref}\n{chunk.text}")

    excerpts_text = "\n\n".join(excerpts_parts)

    # Build user content (supports text + images for vision)
    user_content_parts = []

    user_content_text = (
        f"[DOCUMENT EXCERPTS]:\n{excerpts_text}\n\n"
        f"[QUESTION]: {question}\n\nAnswer:"
    )

    user_content_parts.append({
        "type": "text",
        "text": user_content_text,
    })

    # Add images if provided (vision capability)
    if image_urls:
        for url in image_urls:
            user_content_parts.append({
                "type": "image_url",
                "image_url": {"url": url},
            })

    messages.append({"role": "user", "content": user_content_parts})

    return messages


async def generate_answer(
    question: str,
    chunks: list[RetrievedChunk],
    conversation_history: Optional[list[MessageSchema]] = None,
    image_urls: Optional[list[str]] = None,
) -> GeneratedAnswer:
    """Generate an answer using Groq API (llama-3.2-90b-vision-preview).

    Builds a RAG prompt with document excerpts, conversation history, question,
    and optional images. Calls the OpenAI-compatible Groq endpoint.

    Supports:
    - Text-only queries
    - Multimodal (text + images) queries
    - JSON mode for structured output
    - Citation parsing via [1], [2] markers
    """
    if not chunks:
        return GeneratedAnswer(
            text="I couldn't find any relevant information in your documents to answer this question.",
            model_used=settings.groq_model,
            citations=[],
        )

    if not settings.groq_api_key:
        raise GenerationError("Groq API key not configured. Set GROQ_API_KEY in .env")

    messages = build_messages(question, chunks, conversation_history, image_urls)

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                settings.groq_api_url,
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.groq_model,
                    "messages": messages,
                    "temperature": settings.groq_temperature,
                    "max_completion_tokens": settings.groq_max_tokens,
                    "top_p": 1,
                    "stream": False,
                },
            )
            response.raise_for_status()
            data = response.json()

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise GroqRateLimitError(
                "Rate limit exceeded. Please wait and retry."
            )
        elif e.response.status_code == 413:
            raise GroqContextLengthError(
                "Prompt too long. Reduce document context or use fewer images."
            )
        elif e.response.status_code >= 500:
            raise GroqAPIError(f"Groq server error: {e.response.text}")
        raise GroqAPIError(f"Groq API error: {e.response.text}")
    except httpx.TimeoutException:
        raise GroqAPIError("Request timed out. The model may be overloaded.")
    except Exception as e:
        raise GenerationError(f"Failed to generate answer: {e}")

    # Parse response
    answer_text = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})

    # Extract citations from [1], [2] markers
    citation_refs = re.findall(r'\[(\d+)\]', answer_text)
    citations = [int(ref) for ref in citation_refs]

    token_usage = {
        "input": usage.get("prompt_tokens", 0),
        "output": usage.get("completion_tokens", 0),
    }

    logger.info(
        "answer_generated",
        model=settings.groq_model,
        input_tokens=token_usage["input"],
        output_tokens=token_usage["output"],
        citations=len(citations),
        has_images=bool(image_urls),
    )

    return GeneratedAnswer(
        text=answer_text,
        citations=citations,
        model_used=settings.groq_model,
        tokens_used=token_usage,
        raw_response=data,
    )
