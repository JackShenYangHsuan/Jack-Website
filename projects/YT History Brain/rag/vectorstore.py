"""ChromaDB vector store for YouTube transcripts."""
import chromadb
from chromadb.config import Settings
from typing import Optional

import config
from .embeddings import get_embeddings


class VectorStore:
    """ChromaDB-based vector store for transcripts."""

    def __init__(self, persist_dir: str = None, collection_name: str = None):
        persist_dir = persist_dir or str(config.CHROMA_DIR)
        collection_name = collection_name or config.COLLECTION_NAME

        self.client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(anonymized_telemetry=False),
        )

        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

        self._embedder = None

    @property
    def embedder(self):
        if self._embedder is None:
            self._embedder = get_embeddings()
        return self._embedder

    def add_transcript(
        self,
        video_id: str,
        chunks: list[str],
        metadata: dict,
    ) -> None:
        """
        Add transcript chunks to the vector store.

        Args:
            video_id: YouTube video ID
            chunks: List of text chunks
            metadata: Video metadata (title, channel, etc.)
        """
        if not chunks:
            return

        # Generate embeddings
        embeddings = self.embedder.embed(chunks)

        # Prepare documents
        ids = [f"{video_id}_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "video_id": video_id,
                "chunk_index": i,
                "title": metadata.get("title", ""),
                "channel": metadata.get("channel", ""),
                "watched_at": metadata.get("watched_at", ""),
            }
            for i in range(len(chunks))
        ]

        # Upsert to collection
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
        )

    def search(
        self,
        query: str,
        n_results: int = 5,
        where: Optional[dict] = None,
    ) -> list[dict]:
        """
        Search for relevant transcript chunks.

        Args:
            query: Search query
            n_results: Number of results to return
            where: Optional filter (e.g., {"video_id": "abc123"})

        Returns:
            List of results with document, metadata, and distance
        """
        query_embedding = self.embedder.embed(query)[0]

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        # Format results
        formatted = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                formatted.append({
                    "text": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0,
                })

        return formatted

    def get_stats(self) -> dict:
        """Get collection statistics."""
        count = self.collection.count()

        # Get unique video IDs
        all_items = self.collection.get(include=["metadatas"])
        video_ids = set()
        if all_items["metadatas"]:
            for meta in all_items["metadatas"]:
                if meta and "video_id" in meta:
                    video_ids.add(meta["video_id"])

        return {
            "total_chunks": count,
            "total_videos": len(video_ids),
        }

    def delete_video(self, video_id: str) -> None:
        """Delete all chunks for a video."""
        self.collection.delete(where={"video_id": video_id})

    def has_video(self, video_id: str) -> bool:
        """Check if video is already indexed."""
        results = self.collection.get(
            where={"video_id": video_id},
            limit=1,
        )
        return len(results["ids"]) > 0
