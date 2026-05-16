"""Sensitive entity detection and masking service."""

import re
from dataclasses import dataclass, field

MASK_CHAR = "█"

PATTERNS = {
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "credit_card": re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"),
    "phone": re.compile(r"\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
    "account_number": re.compile(r"\b(account|acct|a/c)[\s#:]*\d{6,16}\b", re.IGNORECASE),
    "routing_number": re.compile(r"\brouting[\s#:]*\d{9}\b", re.IGNORECASE),
    "dob": re.compile(r"\b(DOB|Date of Birth|Born)[\s:]*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", re.IGNORECASE),
}

SHORT_PATTERNS = {
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "credit_card": re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b"),
    "phone": re.compile(r"\b\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}\b"),
    "email": re.compile(r"\b[\w.-]+@[\w.-]+\.\w{2,}\b"),
}


@dataclass
class MaskedEntity:
    """Information about a masked entity."""
    type: str
    start: int
    end: int
    char_count: int


@dataclass
class MaskedText:
    """Result of text masking."""
    masked: str
    entities: list[MaskedEntity] = field(default_factory=list)
    has_masking: bool = False


def mask_text(text: str, entity_types: list[str] | None = None, use_full_patterns: bool = True) -> MaskedText:
    """Apply regex patterns to find and replace sensitive values.

    Args:
        text: The text to mask.
        entity_types: Optional list of specific entity types to mask. If None, mask all.
        use_full_patterns: Use full pattern set (True) or short set (False, for frontend).

    Returns:
        MaskedText with masked text and list of masked entities.
    """
    patterns = PATTERNS if use_full_patterns else SHORT_PATTERNS

    if entity_types:
        active_patterns = {k: v for k, v in patterns.items() if k in entity_types}
    else:
        active_patterns = patterns

    masked = text
    entities = []

    for entity_type, pattern in active_patterns.items():
        for match in pattern.finditer(text):
            entity = MaskedEntity(
                type=entity_type,
                start=match.start(),
                end=match.end(),
                char_count=match.end() - match.start(),
            )
            entities.append(entity)

    # Sort entities by position (reverse order to avoid offset issues)
    entities.sort(key=lambda e: e.start, reverse=True)

    # Apply masking from end to start to preserve positions
    masked_text = text
    for entity in entities:
        masked_text = (
            masked_text[:entity.start]
            + MASK_CHAR * entity.char_count
            + masked_text[entity.end:]
        )

    return MaskedText(
        masked=masked_text,
        entities=entities,
        has_masking=len(entities) > 0,
    )


def mask_text_short(text: str, entity_types: list[str] | None = None) -> str:
    """Convenience function that returns just the masked string using short patterns."""
    result = mask_text(text, entity_types, use_full_patterns=False)
    return result.masked
