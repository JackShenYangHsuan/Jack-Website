from __future__ import annotations

from fastapi import APIRouter, File, UploadFile, status, HTTPException

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
    try:
        document_id = ingest_pdf(file)
        return UploadResponse(document_id=document_id, message="PDF ingested successfully.")
    except HTTPException:
        # Re-raise HTTPExceptions from the ingestion service
        raise
    except Exception as e:
        # Catch any other unexpected errors and return a proper JSON response
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process PDF: {str(e)}"
        )
