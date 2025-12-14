"""FastAPI routes for video connections and similarity."""
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from rag.connections import ConnectionDiscovery


router = APIRouter(prefix="/api/connections", tags=["connections"])

# Global instance
connection_discovery = ConnectionDiscovery()


class SimilarVideo(BaseModel):
    """Similar video response model."""
    video_id: str
    title: str
    url: str
    categories: list[str]
    summary: str
    similarity: float


class SimilarVideosResponse(BaseModel):
    """Response for similar videos endpoint."""
    video_id: str
    similar_videos: list[SimilarVideo]


class GraphNode(BaseModel):
    """Node in the knowledge graph."""
    id: str
    title: str
    categories: list[str]
    url: str
    summary: str


class GraphEdge(BaseModel):
    """Edge in the knowledge graph."""
    source: str
    target: str
    weight: float


class GraphResponse(BaseModel):
    """Response for graph endpoint."""
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class ConnectionStats(BaseModel):
    """Connection statistics."""
    computed_at: Optional[str]
    video_count: int
    edge_count: int
    similarity_threshold: float


class PrecomputeRequest(BaseModel):
    """Request for precomputing connections."""
    similarity_threshold: float = 0.5
    top_k: int = 10


class PrecomputeResponse(BaseModel):
    """Response after precomputing connections."""
    message: str
    video_count: int
    edge_count: int
    computed_at: str


@router.get("/videos/{video_id}/similar", response_model=SimilarVideosResponse)
async def get_similar_videos(
    video_id: str,
    n_results: int = 5,
):
    """
    Get videos similar to a given video.

    Args:
        video_id: The YouTube video ID
        n_results: Number of similar videos to return (default 5, max 20)
    """
    n_results = min(max(1, n_results), 20)

    try:
        similar = connection_discovery.get_similar_videos(
            video_id=video_id,
            n_results=n_results,
            use_precomputed=True,
        )

        return SimilarVideosResponse(
            video_id=video_id,
            similar_videos=[
                SimilarVideo(
                    video_id=v["video_id"],
                    title=v["title"],
                    url=v["url"],
                    categories=v["categories"],
                    summary=v["summary"],
                    similarity=v["similarity"],
                )
                for v in similar
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding similar videos: {str(e)}")


@router.get("/graph", response_model=GraphResponse)
async def get_connection_graph(
    categories: Optional[str] = None,
    min_similarity: float = 0.5,
):
    """
    Get the knowledge graph data for visualization.

    Args:
        categories: Comma-separated list of categories to filter by
        min_similarity: Minimum similarity threshold for edges (0-1)
    """
    category_filter = categories.split(",") if categories else None

    try:
        graph = connection_discovery.get_graph_data(
            category_filter=category_filter,
            min_similarity=min_similarity,
        )

        return GraphResponse(
            nodes=[
                GraphNode(
                    id=n["id"],
                    title=n["title"],
                    categories=n.get("categories", []),
                    url=n["url"],
                    summary=n.get("summary", ""),
                )
                for n in graph["nodes"]
            ],
            edges=[
                GraphEdge(
                    source=e["source"],
                    target=e["target"],
                    weight=e["weight"],
                )
                for e in graph["edges"]
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting graph data: {str(e)}")


@router.post("/precompute", response_model=PrecomputeResponse)
async def precompute_connections(
    request: PrecomputeRequest = PrecomputeRequest(),
):
    """
    Precompute all video connections based on embedding similarity.
    This should be called after processing new videos.

    Args:
        similarity_threshold: Minimum similarity to store (0-1)
        top_k: Maximum connections per video
    """
    try:
        result = connection_discovery.precompute_connections(
            similarity_threshold=request.similarity_threshold,
            top_k=request.top_k,
        )

        return PrecomputeResponse(
            message="Connections precomputed successfully",
            video_count=result["video_count"],
            edge_count=result["edge_count"],
            computed_at=result["computed_at"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error precomputing connections: {str(e)}")


@router.get("/stats", response_model=ConnectionStats)
async def get_connection_stats():
    """Get statistics about precomputed connections."""
    stats = connection_discovery.get_stats()
    return ConnectionStats(
        computed_at=stats.get("computed_at"),
        video_count=stats.get("video_count", 0),
        edge_count=stats.get("edge_count", 0),
        similarity_threshold=stats.get("similarity_threshold", 0.5),
    )


@router.get("/status")
async def get_connection_status():
    """Check if connections have been precomputed."""
    return {
        "has_precomputed": connection_discovery.has_precomputed(),
        "stats": connection_discovery.get_stats(),
    }
