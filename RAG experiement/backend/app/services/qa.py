from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable, Optional
from uuid import UUID, uuid4

from fastapi import HTTPException, status

from ..config import get_settings
from ..models.schemas import ChatResponse, Citation
from .embeddings import embed_query
from .openai_client import get_client
from .vector_store import similarity_search

_settings = get_settings()

BASE_PROMPT = """You are a helpful assistant that answers questions using the provided context.
Use only the supplied context snippets to craft your answer.
If the answer is not in the context, reply that you do not know.
Always cite the page numbers you relied on.

Context:
{context}

User question: {question}
"""


def format_context(snippets: Iterable[dict]) -> tuple[str, list[Citation]]:
    formatted_chunks: list[str] = []
    citations: list[Citation] = []
    for match in snippets:
        metadata = match.get("metadata") or {}
        text = metadata.get("text", "")
        page_value = metadata.get("page", 0)
        document_id_str = metadata.get("document_id")
        chunk_index = metadata.get("chunk_index", 0)
        formatted_chunks.append(
            f"[Doc {document_id_str} | Page {page_value} | Chunk {chunk_index}] {text}"
        )

        doc_uuid: UUID
        if document_id_str:
            try:
                doc_uuid = UUID(str(document_id_str))
            except ValueError:
                doc_uuid = UUID(int=0)
        else:
            doc_uuid = UUID(int=0)

        citations.append(
            Citation(
                document_id=doc_uuid,
                page=int(page_value) if isinstance(page_value, (int, float)) else 0,
                score=float(match.get("score", 0.0)),
                snippet=text[:280],
            )
        )
    return "\n\n".join(formatted_chunks), citations


def answer_question(
    question: str,
    document_ids: Optional[list[UUID]] = None,
    session_id: Optional[UUID] = None,
) -> ChatResponse:
    if not question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty.",
        )

    if not document_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one document_id is required to run retrieval.",
        )

    namespace = str(document_ids[0])
    query_embedding = embed_query(question)
    matches = similarity_search(
        query_embedding=query_embedding,
        top_k=_settings.max_context_chunks,
        namespace=namespace,
    )
    context, citations = format_context(matches)

    client = get_client()
    completion = client.chat.completions.create(
        model=_settings.gpt_model,
        messages=[
            {
                "role": "system",
                "content": "You are a retrieval augmented assistant. Only answer with information from the provided context.",
            },
            {"role": "user", "content": BASE_PROMPT.format(context=context, question=question)},
        ],
    )

    answer = completion.choices[0].message.content or ""
    response_session_id = session_id or uuid4()

    usage = None
    if completion.usage:
        usage = {
            "input_tokens": completion.usage.prompt_tokens,
            "output_tokens": completion.usage.completion_tokens,
        }

    return ChatResponse(
        session_id=response_session_id,
        answer=answer,
        citations=citations,
        created_at=datetime.utcnow(),
        usage=usage,
    )
