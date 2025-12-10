from __future__ import annotations

from typing import Optional, Sequence
from uuid import UUID

from pinecone import Index, Pinecone

from ..config import get_settings

_settings = get_settings()
_pinecone_client: Optional[Pinecone] = None
_index: Optional[Index] = None


def get_index() -> Index:
    global _pinecone_client, _index
    if _index is not None:
        return _index

    _pinecone_client = Pinecone(api_key=_settings.pinecone_api_key)
    _index = _pinecone_client.Index(_settings.pinecone_index_name)
    return _index


def upsert_chunks(
    document_id: UUID,
    chunks: Sequence[str],
    embeddings: Sequence[list[float]],
    pages: Sequence[int],
) -> None:
    if len(chunks) != len(embeddings):
        raise ValueError("Chunks and embeddings must have identical length.")
    if len(chunks) != len(pages):
        raise ValueError("Page metadata must align with chunks.")

    index = get_index()
    vectors = []
    for idx, (chunk, embedding, page) in enumerate(zip(chunks, embeddings, pages)):
        vector_id = f"{document_id}:{idx}"
        vectors.append(
            {
                "id": vector_id,
                "values": embedding,
                "metadata": {
                    "document_id": str(document_id),
                    "chunk_index": idx,
                    "page": page,
                    "text": chunk,
                },
            }
        )
    if vectors:
        index.upsert(vectors=vectors, namespace=str(document_id))


def similarity_search(
    query_embedding: list[float],
    top_k: int,
    namespace: str,
) -> list[dict]:
    index = get_index()
    response = index.query(
        namespace=namespace,
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
    )
    return response["matches"]  # type: ignore[index]
