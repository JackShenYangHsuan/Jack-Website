from __future__ import annotations

from fastapi import APIRouter, File, UploadFile, status

from ..models.schemas import UploadResponse
from ..services.ingestion import ingest_pdf

router = APIRouter()


@router.post(
    "/pdf",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF for ingestion",
)
async def upload_pdf(file: UploadFile = File(...)) -> UploadResponse:
    document_id = ingest_pdf(file)
    return UploadResponse(document_id=document_id, message="PDF ingested successfully.")
