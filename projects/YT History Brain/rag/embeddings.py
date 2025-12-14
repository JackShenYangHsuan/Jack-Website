"""Embedding generation for RAG."""
from typing import Union
import httpx

import config


class LocalEmbeddings:
    """Local embeddings using sentence-transformers."""

    def __init__(self, model_name: str = None):
        from sentence_transformers import SentenceTransformer

        self.model_name = model_name or config.LOCAL_EMBEDDING_MODEL
        self.model = SentenceTransformer(self.model_name)

    def embed(self, texts: Union[str, list[str]]) -> list[list[float]]:
        """Generate embeddings for texts."""
        if isinstance(texts, str):
            texts = [texts]
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()


class OpenRouterEmbeddings:
    """Embeddings via OpenRouter API."""

    def __init__(self, api_key: str = None, model: str = "openai/text-embedding-3-small"):
        self.api_key = api_key or config.OPENROUTER_API_KEY
        self.model = model
        self.base_url = config.OPENROUTER_BASE_URL

    def embed(self, texts: Union[str, list[str]]) -> list[list[float]]:
        """Generate embeddings via OpenRouter."""
        if isinstance(texts, str):
            texts = [texts]

        with httpx.Client() as client:
            response = client.post(
                f"{self.base_url}/embeddings",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "input": texts,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()

        return [item["embedding"] for item in data["data"]]


def get_embeddings(provider: str = None):
    """Get embedding model based on config."""
    provider = provider or config.EMBEDDING_PROVIDER

    if provider == "local":
        return LocalEmbeddings()
    elif provider == "openrouter":
        return OpenRouterEmbeddings()
    else:
        raise ValueError(f"Unknown embedding provider: {provider}")
