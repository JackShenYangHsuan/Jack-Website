"""Connection discovery and similarity computation for videos."""
import json
import logging
import numpy as np
from datetime import datetime
from typing import Optional
from pathlib import Path

import config
from .summary_store import SummaryStore

logger = logging.getLogger(__name__)

DEFAULT_CONNECTIONS = {"version": 1, "computed_at": None, "connections": {}, "graph": {"nodes": [], "edges": []}}


class ConnectionDiscovery:
    """Discover and compute connections between videos based on embedding similarity."""

    def __init__(self, data_dir: Path = None):
        self.data_dir = data_dir or config.DATA_DIR
        self.connections_path = self.data_dir / "connections.json"
        self.summary_store = SummaryStore()

    def _load_connections(self) -> dict:
        """Load precomputed connections from disk."""
        if not self.connections_path.exists():
            return DEFAULT_CONNECTIONS.copy()
        try:
            with open(self.connections_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            logger.error(f"Corrupted connections.json: {e}. Returning default.")
            return DEFAULT_CONNECTIONS.copy()
        except OSError as e:
            logger.error(f"Failed to read connections.json: {e}. Returning default.")
            return DEFAULT_CONNECTIONS.copy()

    def _save_connections(self, data: dict) -> None:
        """Save connections to disk."""
        try:
            with open(self.connections_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except OSError as e:
            logger.error(f"Failed to save connections.json: {e}")

    def get_all_embeddings(self) -> tuple[list[str], np.ndarray, list[dict]]:
        """
        Extract all embeddings from ChromaDB.

        Returns:
            Tuple of (video_ids, embeddings_matrix, metadatas)
        """
        collection = self.summary_store.collection

        # Get all items with embeddings
        all_data = collection.get(
            include=["embeddings", "metadatas", "documents"]
        )

        if not all_data["ids"]:
            return [], np.array([]), []

        video_ids = all_data["ids"]
        embeddings = np.array(all_data["embeddings"])
        metadatas = all_data["metadatas"] or [{}] * len(video_ids)
        documents = all_data["documents"] or [""] * len(video_ids)

        # Enrich metadata with documents (summaries)
        for i, meta in enumerate(metadatas):
            meta["summary"] = documents[i] if i < len(documents) else ""

        return video_ids, embeddings, metadatas

    def compute_similarity_matrix(self, embeddings: np.ndarray) -> np.ndarray:
        """
        Compute pairwise cosine similarity matrix.

        Args:
            embeddings: Matrix of shape (n_videos, embedding_dim)

        Returns:
            Similarity matrix of shape (n_videos, n_videos)
        """
        if len(embeddings) == 0:
            return np.array([])

        # Normalize embeddings for cosine similarity
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        normalized = embeddings / (norms + 1e-10)

        # Compute cosine similarity matrix
        similarity_matrix = np.dot(normalized, normalized.T)

        return similarity_matrix

    def precompute_connections(
        self,
        similarity_threshold: float = 0.5,
        top_k: int = 10,
    ) -> dict:
        """
        Precompute all video connections based on embedding similarity.
        Only includes videos that have been fully processed with summaries.

        Args:
            similarity_threshold: Minimum similarity to store (0-1)
            top_k: Maximum connections per video

        Returns:
            Connection data with graph structure
        """
        # Load processed videos to filter
        processed_videos_path = self.data_dir / "processed_videos.json"
        processed_ids = set()
        processed_data = {"videos": []}
        if processed_videos_path.exists():
            try:
                with open(processed_videos_path, "r", encoding="utf-8") as f:
                    processed_data = json.load(f)
            except (json.JSONDecodeError, OSError) as e:
                logger.error(f"Failed to load processed_videos.json: {e}")
        # Only include videos with proper summaries (not title-only)
        for v in processed_data.get("videos", []):
                summary = v.get("summary", "")
                # Skip videos without proper transcript-based summaries
                if not summary:
                    continue
                if "Based on the title" in summary:
                    continue
                if "Transcript not available" in summary:
                    continue
                if summary.startswith("The video likely"):
                    continue
                if summary.startswith("This video likely"):
                    continue
                if "Not yet processed" in summary:
                    continue
                processed_ids.add(v["video_id"])

        video_ids, embeddings, metadatas = self.get_all_embeddings()

        if len(video_ids) == 0:
            return {"version": 1, "computed_at": datetime.now().isoformat(), "connections": {}, "graph": {"nodes": [], "edges": []}}

        # Filter to only include processed videos
        if processed_ids:
            filtered_indices = [i for i, vid in enumerate(video_ids) if vid in processed_ids]
            video_ids = [video_ids[i] for i in filtered_indices]
            embeddings = embeddings[filtered_indices]
            metadatas = [metadatas[i] for i in filtered_indices]

        if len(video_ids) == 0:
            return {"version": 1, "computed_at": datetime.now().isoformat(), "connections": {}, "graph": {"nodes": [], "edges": []}}

        # Compute similarity matrix
        similarity_matrix = self.compute_similarity_matrix(embeddings)

        # Build connections dict
        connections = {}
        edges = []
        edge_set = set()  # Track unique edges

        for i, vid_i in enumerate(video_ids):
            similarities = similarity_matrix[i]

            # Get indices sorted by similarity (descending), excluding self
            sorted_indices = np.argsort(similarities)[::-1]

            video_connections = []
            for j in sorted_indices:
                if i == j:
                    continue
                sim = float(similarities[j])
                if sim < similarity_threshold:
                    break
                if len(video_connections) >= top_k:
                    break

                vid_j = video_ids[j]
                video_connections.append({
                    "video_id": vid_j,
                    "similarity": round(sim, 4)
                })

                # Add edge (avoid duplicates)
                edge_key = tuple(sorted([vid_i, vid_j]))
                if edge_key not in edge_set:
                    edge_set.add(edge_key)
                    edges.append({
                        "source": vid_i,
                        "target": vid_j,
                        "weight": round(sim, 4)
                    })

            connections[vid_i] = video_connections

        # Build nodes list
        nodes = []
        for i, vid in enumerate(video_ids):
            meta = metadatas[i] if i < len(metadatas) else {}
            categories_str = meta.get("categories", "")
            categories = categories_str.split(",") if categories_str else []

            nodes.append({
                "id": vid,
                "title": meta.get("title", ""),
                "categories": categories,
                "url": meta.get("url", f"https://www.youtube.com/watch?v={vid}"),
                "summary": meta.get("summary", "")[:200],  # Truncate for graph
            })

        result = {
            "version": 1,
            "computed_at": datetime.now().isoformat(),
            "video_count": len(video_ids),
            "edge_count": len(edges),
            "similarity_threshold": similarity_threshold,
            "top_k": top_k,
            "connections": connections,
            "graph": {
                "nodes": nodes,
                "edges": edges
            }
        }

        self._save_connections(result)
        return result

    def get_similar_videos(
        self,
        video_id: str,
        n_results: int = 5,
        use_precomputed: bool = True,
    ) -> list[dict]:
        """
        Get similar videos for a given video.

        Args:
            video_id: Video ID to find similar videos for
            n_results: Number of similar videos to return
            use_precomputed: Whether to use precomputed connections

        Returns:
            List of similar videos with metadata and similarity scores
        """
        if use_precomputed:
            data = self._load_connections()
            if video_id in data.get("connections", {}):
                connections = data["connections"][video_id][:n_results]

                # Enrich with video metadata
                video_lookup = {n["id"]: n for n in data.get("graph", {}).get("nodes", [])}
                enriched = []
                for conn in connections:
                    vid = conn["video_id"]
                    node = video_lookup.get(vid, {})
                    enriched.append({
                        "video_id": vid,
                        "title": node.get("title", ""),
                        "url": node.get("url", f"https://www.youtube.com/watch?v={vid}"),
                        "categories": node.get("categories", []),
                        "summary": node.get("summary", ""),
                        "similarity": conn["similarity"]
                    })
                return enriched

        # Fallback: compute on the fly using ChromaDB search
        # Get the source video's summary to use as query
        collection = self.summary_store.collection
        source_data = collection.get(ids=[video_id], include=["documents"])

        if not source_data["documents"]:
            return []

        source_summary = source_data["documents"][0]

        # Search for similar summaries
        results = self.summary_store.search(source_summary, n_results=n_results + 1)

        # Filter out the source video and format results
        similar = []
        for r in results:
            if r["video_id"] == video_id:
                continue
            similar.append({
                "video_id": r["video_id"],
                "title": r["title"],
                "url": r["url"],
                "categories": r["categories"],
                "summary": r["summary"],
                "similarity": round(1 - r["distance"], 4)  # Convert distance to similarity
            })
            if len(similar) >= n_results:
                break

        return similar

    def get_graph_data(
        self,
        category_filter: Optional[list[str]] = None,
        min_similarity: float = 0.5,
    ) -> dict:
        """
        Get graph data for visualization.

        Args:
            category_filter: Only include nodes with these categories
            min_similarity: Minimum edge weight to include

        Returns:
            Graph data with filtered nodes and edges
        """
        data = self._load_connections()
        graph = data.get("graph", {"nodes": [], "edges": []})

        if not graph["nodes"]:
            return {"nodes": [], "edges": []}

        # Filter nodes by category
        if category_filter:
            category_set = set(category_filter)
            filtered_nodes = [
                n for n in graph["nodes"]
                if any(cat in category_set for cat in n.get("categories", []))
            ]
            filtered_ids = {n["id"] for n in filtered_nodes}
        else:
            filtered_nodes = graph["nodes"]
            filtered_ids = {n["id"] for n in filtered_nodes}

        # Filter edges
        filtered_edges = [
            e for e in graph["edges"]
            if e["source"] in filtered_ids
            and e["target"] in filtered_ids
            and e["weight"] >= min_similarity
        ]

        return {
            "nodes": filtered_nodes,
            "edges": filtered_edges
        }

    def has_precomputed(self) -> bool:
        """Check if precomputed connections exist."""
        return self.connections_path.exists()

    def get_stats(self) -> dict:
        """Get connection statistics."""
        data = self._load_connections()
        return {
            "computed_at": data.get("computed_at"),
            "video_count": data.get("video_count", 0),
            "edge_count": data.get("edge_count", 0),
            "similarity_threshold": data.get("similarity_threshold", 0.5),
        }
