"""ChromaDB vector store for video summaries."""
import chromadb
from chromadb.config import Settings
from typing import Optional

import config
from .embeddings import get_embeddings


class SummaryStore:
    """ChromaDB-based vector store for video summaries."""

    def __init__(self, persist_dir: str = None, collection_name: str = None):
        persist_dir = persist_dir or str(config.CHROMA_DIR)
        collection_name = collection_name or config.SUMMARY_COLLECTION_NAME

        self.client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(anonymized_telemetry=False),
        )

        # Get or create collection for summaries
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

    def index_summary(
        self,
        video_id: str,
        summary: str,
        metadata: dict,
    ) -> None:
        """
        Add or update a single video summary.

        Args:
            video_id: YouTube video ID
            summary: Video summary text
            metadata: Video metadata (title, url, categories)
        """
        if not summary or summary == "No summary available.":
            return

        # Generate embedding for the summary
        embedding = self.embedder.embed(summary)[0]

        # Store with metadata
        self.collection.upsert(
            ids=[video_id],
            embeddings=[embedding],
            documents=[summary],
            metadatas=[{
                "video_id": video_id,
                "title": metadata.get("title", ""),
                "url": metadata.get("url", ""),
                "categories": ",".join(metadata.get("categories", [])),
            }],
        )

    def index_all_summaries(self, videos: list[dict]) -> int:
        """
        Bulk index all video summaries.

        Args:
            videos: List of video dictionaries with video_id, summary, title, url, categories

        Returns:
            Number of summaries indexed
        """
        indexed = 0
        for video in videos:
            summary = video.get("summary", "")
            if summary and summary != "No summary available.":
                self.index_summary(
                    video["video_id"],
                    summary,
                    video
                )
                indexed += 1
        return indexed

    def search(
        self,
        query: str,
        n_results: int = 10,
        where: Optional[dict] = None,
    ) -> list[dict]:
        """
        Search summaries by semantic similarity.

        Args:
            query: Search query
            n_results: Number of results to return
            where: Optional filter

        Returns:
            List of results with video info and distance
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
                meta = results["metadatas"][0][i] if results["metadatas"] else {}
                categories_str = meta.get("categories", "")
                categories = categories_str.split(",") if categories_str else []

                formatted.append({
                    "video_id": meta.get("video_id"),
                    "title": meta.get("title"),
                    "url": meta.get("url"),
                    "summary": doc,
                    "categories": categories,
                    "distance": results["distances"][0][i] if results["distances"] else 0,
                })

        return formatted

    def get_indexed_count(self) -> int:
        """Get number of indexed summaries."""
        return self.collection.count()

    def needs_reindex(self, total_videos_with_summaries: int) -> bool:
        """Check if reindexing is needed based on count mismatch."""
        return self.get_indexed_count() < total_videos_with_summaries

    def has_video(self, video_id: str) -> bool:
        """Check if video summary is already indexed."""
        results = self.collection.get(
            ids=[video_id],
        )
        return len(results["ids"]) > 0

    def delete_video(self, video_id: str) -> None:
        """Delete a video summary from the index."""
        try:
            self.collection.delete(ids=[video_id])
        except Exception:
            pass  # Video might not exist

    def clear_all(self) -> None:
        """Clear all summaries from the collection."""
        # Get all IDs and delete them
        all_items = self.collection.get()
        if all_items["ids"]:
            self.collection.delete(ids=all_items["ids"])
