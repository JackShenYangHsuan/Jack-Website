from __future__ import annotations

from fastapi import APIRouter, status

from ..models.schemas import ChatRequest, ChatResponse
from ..services.qa import answer_question

router = APIRouter()


@router.post(
    "/qa",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask a question over previously ingested documents",
)
async def chat_with_documents(payload: ChatRequest) -> ChatResponse:
    return answer_question(
        question=payload.question,
        document_ids=payload.document_ids,
        session_id=payload.session_id,
    )
