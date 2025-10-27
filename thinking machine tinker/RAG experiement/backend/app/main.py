from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import uploads, chat


app = FastAPI(
    title="RAG Experiment API",
    version="0.1.0",
    description="Backend service for uploading PDFs and running GPT-powered retrieval augmented question answering.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/healthz")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
