from __future__ import annotations

from typing import Sequence

from .openai_client import get_client
from ..config import get_settings

_settings = get_settings()


def embed_chunks(chunks: Sequence[str]) -> list[list[float]]:
    if not chunks:
        return []

    client = get_client()
    response = client.embeddings.create(
        input=list(chunks),
        model=_settings.embedding_model,
    )
    return [item.embedding for item in response.data]


def embed_query(query: str) -> list[float]:
    client = get_client()
    response = client.embeddings.create(
        input=[query],
        model=_settings.embedding_model,
    )
    return response.data[0].embedding
