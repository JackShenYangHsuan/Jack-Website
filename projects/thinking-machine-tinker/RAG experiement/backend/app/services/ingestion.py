from __future__ import annotations

import io
import re
from uuid import UUID, uuid4

import pdfplumber
from fastapi import HTTPException, UploadFile, status

from ..config import get_settings
from .chunker import chunk_text
from .embeddings import embed_chunks
from .vector_store import upsert_chunks

_settings = get_settings()


def _read_file_bytes(upload: UploadFile) -> bytes:
    file_bytes = upload.file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file appears to be empty.",
        )
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > _settings.max_upload_size_mb:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {_settings.max_upload_size_mb}MB limit.",
        )
    return file_bytes


def _extract_text_from_pdf(file_bytes: bytes) -> list[tuple[int, str]]:
    page_text: list[tuple[int, str]] = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for index, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            page_text.append((index, text))
    if not page_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to read text from the supplied PDF.",
        )
    return page_text


def ingest_pdf(upload: UploadFile) -> UUID:
    if upload.content_type not in {"application/pdf"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF uploads are supported.",
        )

    file_bytes = _read_file_bytes(upload)
    pages = _extract_text_from_pdf(file_bytes)
    document_id = uuid4()

    combined_text = "\n\n".join(f"[Page {page}] {text}" for page, text in pages)

    raw_chunks = list(
        chunk_text(
            combined_text,
            chunk_size=_settings.chunk_size,
            chunk_overlap=_settings.chunk_overlap,
        )
    )
    chunks: list[str] = []
    page_numbers: list[int] = []
    for chunk in raw_chunks:
        match = re.search(r"\[Page (\d+)\]", chunk)
        page_number = int(match.group(1)) if match else 0
        cleaned_chunk = chunk.replace(f"[Page {page_number}]", "").strip() if match else chunk
        if cleaned_chunk:
            chunks.append(cleaned_chunk)
            page_numbers.append(page_number)

    embeddings = embed_chunks(chunks)
    upsert_chunks(
        document_id=document_id,
        chunks=chunks,
        embeddings=embeddings,
        pages=page_numbers,
    )

    return document_id
