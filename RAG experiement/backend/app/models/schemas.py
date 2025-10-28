from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    document_id: UUID = Field(..., description="Reference ID for the uploaded PDF.")
    message: str = Field(..., description="Human friendly confirmation.")


class ChatRequest(BaseModel):
    question: str
    session_id: Optional[UUID] = Field(None, description="Conversation session identifier.")
    document_ids: Optional[list[UUID]] = Field(
        None, description="Limit retrieval to a subset of previously uploaded documents."
    )


class Citation(BaseModel):
    document_id: UUID
    page: int
    score: float
    snippet: str


class ChatResponse(BaseModel):
    session_id: UUID
    answer: str
    citations: list[Citation]
    created_at: datetime
    usage: Optional[dict[str, Any]] = None


class ErrorResponse(BaseModel):
    detail: str
