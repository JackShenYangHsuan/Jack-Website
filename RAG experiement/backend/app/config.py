from functools import lru_cache
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    pinecone_api_key: str = Field(..., alias="PINECONE_API_KEY")
    pinecone_index_name: str = Field(..., alias="PINECONE_INDEX_NAME")
    pinecone_environment: str = Field(..., alias="PINECONE_ENVIRONMENT")
    openai_api_key: str = Field(..., alias="OPENAI_API_KEY")
    embedding_model: str = Field("text-embedding-3-large", alias="EMBEDDING_MODEL")
    gpt_model: str = Field("gpt-4o-mini", alias="GPT_MODEL")
    chunk_size: int = Field(800, alias="CHUNK_SIZE")
    chunk_overlap: int = Field(120, alias="CHUNK_OVERLAP")
    max_context_chunks: int = Field(6, alias="MAX_CONTEXT_CHUNKS")
    max_upload_size_mb: int = Field(25, alias="MAX_UPLOAD_SIZE_MB")
    storage_bucket: Optional[str] = Field(None, alias="STORAGE_BUCKET")
    cors_origins: str = Field("http://localhost:8888", alias="CORS_ORIGINS")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
