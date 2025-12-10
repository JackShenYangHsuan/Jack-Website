from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import uploads, chat
from .config import get_settings

settings = get_settings()

app = FastAPI(
    title="RAG Experiment API",
    version="0.1.0",
    description="Backend service for uploading PDFs and running GPT-powered retrieval augmented question answering.",
)

# Parse CORS origins from comma-separated string and drop empties
cors_origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/healthz")
async def healthcheck():
    return {"status": "ok"}
