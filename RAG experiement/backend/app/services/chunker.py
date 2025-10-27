from __future__ import annotations

import re
from typing import Iterable


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def chunk_text(
    text: str,
    chunk_size: int,
    chunk_overlap: int,
) -> Iterable[str]:
    cleaned = normalize_whitespace(text)
    if not cleaned:
        return []

    tokens = cleaned.split(" ")
    step = max(chunk_size - chunk_overlap, 1)
    chunks: list[str] = []
    for start in range(0, len(tokens), step):
        window = tokens[start : start + chunk_size]
        if not window:
            continue
        chunks.append(" ".join(window))
    return chunks
