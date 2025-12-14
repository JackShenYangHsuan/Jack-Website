"""FastAPI routes for YT History Brain."""
import asyncio
import json
import logging
import re
import httpx
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import config

logger = logging.getLogger(__name__)
from scraper.parser import parse_watch_history, get_unique_video_ids
from transcripts.fetcher import TranscriptFetcher
from rag.vectorstore import VectorStore
from rag.query import RAGQuery
from rag.summary_store import SummaryStore
from rag.summary_query import SummaryQuery
from api.summarizer import VideoSummarizer, VideoSummary


async def fetch_video_title(video_id: str) -> str:
    """Fetch video title from YouTube using oEmbed API."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("title", f"Video {video_id}")
    except Exception as e:
        print(f"Error fetching title for {video_id}: {e}")
    return f"Video {video_id}"

router = APIRouter()

# Global instances
vectorstore = VectorStore()
rag_query = RAGQuery(vectorstore)
transcript_fetcher = TranscriptFetcher()
video_summarizer = VideoSummarizer()
summary_store = SummaryStore()
summary_query = SummaryQuery(summary_store)

# Path to processed videos JSON
PROCESSED_VIDEOS_PATH = config.DATA_DIR / "processed_videos.json"


class QueryRequest(BaseModel):
    question: str
    n_results: int = 5


class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]


class StatsResponse(BaseModel):
    total_videos: int
    total_chunks: int
    transcripts_cached: int


class SyncStatus(BaseModel):
    processed: int
    total: int
    current_video: Optional[str] = None
    success_count: int
    failed_count: int


# In-memory sync status
_sync_status = SyncStatus(processed=0, total=0, success_count=0, failed_count=0)


@router.post("/query", response_model=QueryResponse)
async def query_transcripts(request: QueryRequest):
    """Query the YouTube transcript knowledge base."""
    if not config.OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")

    result = rag_query.query(request.question, n_results=request.n_results)
    return QueryResponse(answer=result["answer"], sources=result["sources"])


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get statistics about indexed content."""
    stats = vectorstore.get_stats()
    cached_count = len(list(config.TRANSCRIPTS_DIR.glob("*.json")))
    return StatsResponse(
        total_videos=stats["total_videos"],
        total_chunks=stats["total_chunks"],
        transcripts_cached=cached_count,
    )


@router.post("/upload-history")
async def upload_watch_history(file: UploadFile = File(...)):
    """Upload a watch-history.json file from Google Takeout."""
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="File must be JSON")

    # Save uploaded file
    content = await file.read()
    upload_path = config.TAKEOUT_DIR / "watch-history.json"
    upload_path.write_bytes(content)

    # Parse entries
    entries = parse_watch_history(upload_path)
    unique_ids = get_unique_video_ids(entries)

    return {
        "message": "Watch history uploaded successfully",
        "total_entries": len(entries),
        "unique_videos": len(unique_ids),
    }


@router.post("/sync")
async def trigger_sync():
    """Process uploaded watch history and fetch transcripts."""
    global _sync_status

    history_file = config.TAKEOUT_DIR / "watch-history.json"
    if not history_file.exists():
        raise HTTPException(status_code=400, detail="No watch history uploaded. Upload first.")

    # Parse watch history
    entries = parse_watch_history(history_file)
    unique_ids = get_unique_video_ids(entries)

    # Filter out already indexed videos
    video_ids_to_process = [
        vid for vid in unique_ids if not vectorstore.has_video(vid)
    ]

    if not video_ids_to_process:
        return {"message": "All videos already indexed", "new_videos": 0}

    # Create entry lookup for metadata
    entry_lookup = {e.video_id: e for e in entries}

    # Reset status
    _sync_status = SyncStatus(
        processed=0,
        total=len(video_ids_to_process),
        success_count=0,
        failed_count=0,
    )

    # Process videos
    for video_id in video_ids_to_process:
        _sync_status.current_video = video_id
        _sync_status.processed += 1

        # Fetch transcript
        transcript = transcript_fetcher.fetch(video_id)

        if transcript:
            # Chunk and index
            full_text = transcript.full_text
            chunks = chunk_text(full_text)

            entry = entry_lookup.get(video_id)
            metadata = {
                "title": entry.title if entry else "",
                "channel": entry.channel_name if entry else "",
                "watched_at": entry.watched_at.isoformat() if entry else "",
            }

            vectorstore.add_transcript(video_id, chunks, metadata)
            _sync_status.success_count += 1
        else:
            _sync_status.failed_count += 1

    _sync_status.current_video = None

    return {
        "message": "Sync complete",
        "processed": _sync_status.processed,
        "success": _sync_status.success_count,
        "failed": _sync_status.failed_count,
    }


@router.get("/sync-status")
async def get_sync_status():
    """Get current sync progress."""
    return _sync_status


def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> list[str]:
    """Split text into overlapping chunks."""
    chunk_size = chunk_size or config.CHUNK_SIZE
    overlap = overlap or config.CHUNK_OVERLAP

    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start = end - overlap

    return chunks


# ============================================================================
# NEW ENDPOINTS: Video Summary Dashboard
# ============================================================================

class ProcessingStatus(BaseModel):
    """Processing status for video summarization."""
    is_processing: bool
    processed: int
    total: int
    current_video: Optional[str] = None
    current_title: Optional[str] = None
    stopped_due_to_api_block: bool = False  # True if stopped due to YouTube blocking
    api_block_message: Optional[str] = None  # Message to show user


class VideoResponse(BaseModel):
    """Response model for a processed video."""
    video_id: str
    title: str
    url: str
    summary: str
    categories: list[str]
    transcript_available: bool
    takeaways: list[str] = []  # Key insights from the video
    fun_facts: list[str] = []  # Interesting facts mentioned


# Global processing status
_processing_status = ProcessingStatus(
    is_processing=False,
    processed=0,
    total=0,
    stopped_due_to_api_block=False,
    api_block_message=None
)


def extract_video_id(url: str) -> Optional[str]:
    """Extract video ID from YouTube URL."""
    patterns = [
        r"(?:v=|\/v\/|youtu\.be\/)([a-zA-Z0-9_-]{11})",
        r"(?:embed\/)([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def load_processed_videos() -> dict:
    """Load processed videos from JSON file."""
    if not PROCESSED_VIDEOS_PATH.exists():
        return {"videos": []}
    try:
        with open(PROCESSED_VIDEOS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Corrupted processed_videos.json: {e}")
        return {"videos": []}
    except OSError as e:
        logger.error(f"Failed to read processed_videos.json: {e}")
        return {"videos": []}


def save_processed_videos(data: dict) -> None:
    """Save processed videos to JSON file."""
    try:
        with open(PROCESSED_VIDEOS_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except OSError as e:
        logger.error(f"Failed to save processed_videos.json: {e}")


@router.get("/videos")
async def get_videos():
    """Get all processed videos with summaries and categories."""
    data = load_processed_videos()
    return {"videos": data.get("videos", []), "total": len(data.get("videos", []))}


@router.delete("/videos/{video_id}")
async def delete_video(video_id: str):
    """Delete a video from processed videos and all related data."""
    data = load_processed_videos()
    videos = data.get("videos", [])

    # Find and remove the video
    original_count = len(videos)
    videos = [v for v in videos if v.get("video_id") != video_id]

    if len(videos) == original_count:
        raise HTTPException(status_code=404, detail="Video not found")

    data["videos"] = videos
    save_processed_videos(data)

    # Also remove from summary index if exists
    try:
        summary_store.delete_video(video_id)
    except Exception:
        pass  # Ignore if not in index

    # Remove from connections graph
    connections_path = config.DATA_DIR / "connections.json"
    if connections_path.exists():
        try:
            with open(connections_path, "r", encoding="utf-8") as f:
                conn_data = json.load(f)

            # Remove from nodes
            conn_data["graph"]["nodes"] = [
                n for n in conn_data.get("graph", {}).get("nodes", [])
                if n.get("id") != video_id
            ]

            # Remove edges involving this video
            conn_data["graph"]["edges"] = [
                e for e in conn_data.get("graph", {}).get("edges", [])
                if e.get("source") != video_id and e.get("target") != video_id
            ]

            # Remove from connections dict
            if video_id in conn_data.get("connections", {}):
                del conn_data["connections"][video_id]

            # Remove video from other videos' connection lists
            for vid, conns in conn_data.get("connections", {}).items():
                conn_data["connections"][vid] = [
                    c for c in conns if c.get("video_id") != video_id
                ]

            # Update counts
            conn_data["video_count"] = len(conn_data["graph"]["nodes"])
            conn_data["edge_count"] = len(conn_data["graph"]["edges"])

            with open(connections_path, "w", encoding="utf-8") as f:
                json.dump(conn_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error removing video from connections: {e}")

    return {"message": "Video deleted", "video_id": video_id}


@router.post("/videos/{video_id}/process")
async def process_single_video(video_id: str):
    """Process a single video using Gemini API."""
    # Load existing data
    data = load_processed_videos()
    existing_dates = {v["video_id"]: v.get("watched_at") for v in data.get("videos", [])}

    # Find the video URL from watch_history.json
    watch_history_path = config.BASE_DIR / "watch_history.json"
    url = f"https://www.youtube.com/watch?v={video_id}"

    if watch_history_path.exists():
        with open(watch_history_path, "r", encoding="utf-8") as f:
            watch_data = json.load(f)
        for watch_url in watch_data.get("watch_history", []):
            if video_id in watch_url:
                url = watch_url
                break

    try:
        # Fetch video title
        title = await fetch_video_title(video_id)

        # Call Gemini API to summarize
        summary = await video_summarizer.summarize_video(
            video_id=video_id,
            title=title,
            url=url
        )

        if summary:
            video_data = {
                "video_id": summary.video_id,
                "title": summary.title,
                "url": summary.url,
                "summary": summary.summary,
                "categories": summary.categories,
                "transcript_available": True,
                "takeaways": summary.takeaways,
                "fun_facts": summary.fun_facts
            }

            # Preserve watched_at if it exists
            if video_id in existing_dates and existing_dates[video_id]:
                video_data["watched_at"] = existing_dates[video_id]

            # Update or add the video
            videos = data.get("videos", [])
            video_ids = [v["video_id"] for v in videos]
            if video_id in video_ids:
                # Update existing
                for i, v in enumerate(videos):
                    if v["video_id"] == video_id:
                        videos[i] = video_data
                        break
            else:
                videos.append(video_data)

            data["videos"] = videos
            save_processed_videos(data)

            return {
                "success": True,
                "video": video_data
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to generate summary")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ImportVideoItem(BaseModel):
    """Single video to import."""
    url: str
    date: str


class ImportVideosRequest(BaseModel):
    """Request to import multiple videos."""
    videos: list[ImportVideoItem]


@router.post("/import-videos")
async def import_videos(request: ImportVideosRequest):
    """Import videos from a list of URLs and dates."""
    data = load_processed_videos()
    existing_ids = {v.get("video_id") for v in data.get("videos", [])}

    imported_count = 0
    skipped_count = 0

    for item in request.videos:
        video_id = extract_video_id(item.url)
        if not video_id:
            skipped_count += 1
            continue

        if video_id in existing_ids:
            skipped_count += 1
            continue

        # Fetch video title
        title = await fetch_video_title(video_id)

        # Add video with placeholder data (will be processed later)
        new_video = {
            "video_id": video_id,
            "title": title,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "summary": "Not yet processed",
            "categories": [],
            "transcript_available": False,
            "takeaways": [],
            "fun_facts": [],
            "watched_at": item.date,
        }

        data["videos"].append(new_video)
        existing_ids.add(video_id)
        imported_count += 1

    save_processed_videos(data)

    return {
        "message": f"Imported {imported_count} videos",
        "imported_count": imported_count,
        "skipped_count": skipped_count,
    }


@router.get("/category-stats")
async def get_category_stats():
    """Get category distribution statistics."""
    data = load_processed_videos()
    videos = data.get("videos", [])

    # Count videos per category
    category_counts: dict[str, int] = {}
    for video in videos:
        for cat in video.get("categories", []):
            category_counts[cat] = category_counts.get(cat, 0) + 1

    total = len(videos)
    stats = [
        {
            "category": cat,
            "count": count,
            "percentage": round((count / total) * 100, 1) if total > 0 else 0
        }
        for cat, count in sorted(category_counts.items(), key=lambda x: -x[1])
    ]

    return {"stats": stats, "total_videos": total}


# Path to cache channel data
CHANNEL_CACHE_PATH = config.DATA_DIR / "channel_cache.json"


def load_channel_cache() -> dict:
    """Load cached channel data."""
    if not CHANNEL_CACHE_PATH.exists():
        return {}
    try:
        with open(CHANNEL_CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Corrupted channel_cache.json: {e}")
        return {}
    except OSError as e:
        logger.error(f"Failed to read channel_cache.json: {e}")
        return {}


def save_channel_cache(data: dict) -> None:
    """Save channel cache to file."""
    try:
        with open(CHANNEL_CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except OSError as e:
        logger.error(f"Failed to save channel_cache.json: {e}")


async def fetch_channel_name(video_id: str) -> Optional[str]:
    """Fetch channel name from YouTube using oEmbed API."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("author_name")
    except Exception as e:
        print(f"Error fetching channel for {video_id}: {e}")
    return None


@router.get("/channel-stats")
async def get_channel_stats():
    """Get channel/creator distribution statistics."""
    data = load_processed_videos()
    videos = data.get("videos", [])

    if not videos:
        return {"stats": [], "total_videos": 0}

    # Load cached channel data
    channel_cache = load_channel_cache()

    # Fetch missing channel names
    missing_ids = [v["video_id"] for v in videos if v["video_id"] not in channel_cache]

    # Fetch in batches to avoid rate limiting
    for video_id in missing_ids[:20]:  # Limit to 20 fetches per request
        channel_name = await fetch_channel_name(video_id)
        if channel_name:
            channel_cache[video_id] = channel_name
        await asyncio.sleep(0.1)  # Small delay between requests

    # Save updated cache
    if missing_ids:
        save_channel_cache(channel_cache)

    # Count videos per channel
    channel_counts: dict[str, int] = {}
    for video in videos:
        channel = channel_cache.get(video["video_id"], "Unknown")
        channel_counts[channel] = channel_counts.get(channel, 0) + 1

    total = len(videos)
    stats = [
        {
            "channel": channel,
            "count": count,
            "percentage": round((count / total) * 100, 1) if total > 0 else 0
        }
        for channel, count in sorted(channel_counts.items(), key=lambda x: -x[1])
    ]

    # Return top 15 channels
    return {"stats": stats[:15], "total_videos": total, "total_channels": len(stats)}


@router.get("/process-status")
async def get_process_status():
    """Get current video processing status."""
    return _processing_status


@router.post("/process-videos")
async def process_videos(background_tasks: BackgroundTasks):
    """
    Process all videos from watch_history.json.
    Only processes videos that are not already complete.
    """
    global _processing_status

    if _processing_status.is_processing:
        raise HTTPException(status_code=400, detail="Processing already in progress")

    # Load watch history
    watch_history_path = config.BASE_DIR / "watch_history.json"
    if not watch_history_path.exists():
        raise HTTPException(status_code=404, detail="watch_history.json not found")

    with open(watch_history_path, "r", encoding="utf-8") as f:
        watch_data = json.load(f)

    urls = watch_data.get("watch_history", [])
    if not urls:
        raise HTTPException(status_code=400, detail="No URLs found in watch_history.json")

    # Get unique video IDs
    video_ids = []
    url_map = {}
    for url in urls:
        vid = extract_video_id(url)
        if vid and vid not in url_map:
            video_ids.append(vid)
            url_map[vid] = url

    # Filter out already completed videos (only check if summary is proper, not transcript_available)
    existing = load_processed_videos()
    completed_ids = {
        v["video_id"] for v in existing.get("videos", [])
        if has_proper_summary(v)
    }

    pending_video_ids = [vid for vid in video_ids if vid not in completed_ids]

    if not pending_video_ids:
        return {
            "message": "All videos already processed",
            "total_videos": 0,
            "completed_videos": len(completed_ids)
        }

    # Start background processing with only pending videos
    background_tasks.add_task(
        process_videos_background,
        pending_video_ids,
        url_map
    )

    _processing_status = ProcessingStatus(
        is_processing=True,
        processed=0,
        total=len(pending_video_ids),
        stopped_due_to_api_block=False,
        api_block_message=None
    )

    return {
        "message": "Processing started",
        "total_videos": len(pending_video_ids),
        "skipped_completed": len(completed_ids)
    }


def has_proper_summary(video: dict) -> bool:
    """Check if video has a proper transcript-based summary."""
    summary = video.get("summary", "")
    if not summary:
        return False
    if "Based on the title" in summary:
        return False
    if summary.startswith("This video likely"):
        return False
    if summary == "No summary available.":
        return False
    if "Transcript not available" in summary:
        return False
    if "Could not generate summary" in summary:
        return False
    if "Failed to generate summary" in summary:
        return False
    return True


async def process_videos_background(video_ids: list[str], url_map: dict):
    """Background task to process pending videos using Gemini API directly."""
    global _processing_status

    # Load existing data to preserve completed videos
    existing = load_processed_videos()

    # Create a dict for easy lookup and update (avoids duplicates)
    videos_dict = {v["video_id"]: v for v in existing.get("videos", [])}

    # Preserve watched_at dates from existing videos
    existing_dates = {v["video_id"]: v.get("watched_at") for v in existing.get("videos", [])}

    # Track consecutive failures
    consecutive_failures = 0
    MAX_CONSECUTIVE_FAILURES = 5

    for i, video_id in enumerate(video_ids):
        # Check if we should stop due to API failures
        if consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
            print(f"Stopping processing: {consecutive_failures} consecutive API failures")
            _processing_status.is_processing = False
            _processing_status.stopped_due_to_api_block = True
            _processing_status.api_block_message = "Too many API failures. Processing has been paused. Try again later."
            _processing_status.current_video = None
            _processing_status.current_title = None
            save_processed_videos({"videos": list(videos_dict.values())})
            return

        url = url_map.get(video_id, f"https://www.youtube.com/watch?v={video_id}")

        _processing_status.current_video = video_id
        _processing_status.current_title = f"Video {video_id}"
        _processing_status.processed = i

        try:
            # Fetch video title from YouTube
            title = await fetch_video_title(video_id)
            _processing_status.current_title = title

            # Call Gemini API directly to summarize the video (no transcript needed)
            summary = await video_summarizer.summarize_video(
                video_id=video_id,
                title=title,
                url=url
            )

            if summary:
                # Reset failure counter on success
                consecutive_failures = 0

                video_data = {
                    "video_id": summary.video_id,
                    "title": summary.title,
                    "url": summary.url,
                    "summary": summary.summary,
                    "categories": summary.categories,
                    "transcript_available": True,
                    "takeaways": summary.takeaways,
                    "fun_facts": summary.fun_facts
                }

                # Preserve watched_at if it exists
                if video_id in existing_dates and existing_dates[video_id]:
                    video_data["watched_at"] = existing_dates[video_id]

                # Update dict (replaces if exists, adds if new - no duplicates)
                videos_dict[video_id] = video_data
                print(f"Successfully processed: {title}")
            else:
                # Summarization failed
                consecutive_failures += 1
                print(f"Failed to summarize {video_id} (failures: {consecutive_failures})")

            # Save progress after each video (convert dict back to list)
            save_processed_videos({"videos": list(videos_dict.values())})

            # Rate limiting - wait between API calls
            await asyncio.sleep(0.5)

        except Exception as e:
            print(f"Error processing {video_id}: {e}")
            consecutive_failures += 1

    # Mark processing complete
    _processing_status.is_processing = False
    _processing_status.processed = len(video_ids)
    _processing_status.current_video = None
    _processing_status.current_title = None

    # Final save (convert dict back to list)
    save_processed_videos({"videos": list(videos_dict.values())})


@router.post("/reprocess-title-only")
async def reprocess_title_only_videos(background_tasks: BackgroundTasks):
    """
    Reprocess only videos that have title-based summaries.
    Preserves existing proper summaries.
    """
    global _processing_status

    if _processing_status.is_processing:
        raise HTTPException(status_code=400, detail="Processing already in progress")

    existing = load_processed_videos()
    existing_videos = existing.get("videos", [])

    # Find videos with title-based summaries
    title_based_videos = [
        v for v in existing_videos
        if "Based on the title" in v.get("summary", "")
    ]

    if not title_based_videos:
        return {"message": "No title-based summaries to reprocess", "count": 0}

    background_tasks.add_task(
        reprocess_title_only_background,
        title_based_videos,
        existing_videos
    )

    _processing_status = ProcessingStatus(
        is_processing=True,
        processed=0,
        total=len(title_based_videos)
    )

    return {
        "message": "Reprocessing started",
        "total_videos": len(title_based_videos)
    }


async def reprocess_title_only_background(title_based_videos: list, all_videos: list):
    """Background task to reprocess only title-based summary videos."""
    global _processing_status

    # Create lookup of existing proper summaries (to preserve)
    proper_summaries = {
        v["video_id"]: v for v in all_videos
        if "Based on the title" not in v.get("summary", "")
    }

    processed_data = {"videos": list(proper_summaries.values())}

    for i, video in enumerate(title_based_videos):
        video_id = video["video_id"]
        title = video["title"]
        url = video["url"]

        _processing_status.current_video = video_id
        _processing_status.current_title = title
        _processing_status.processed = i

        try:
            # Try to fetch transcript
            transcript = transcript_fetcher.fetch(video_id)

            if transcript:
                # Got transcript - generate proper summary
                print(f"Got transcript for {video_id}, generating proper summary...")
                summary = await video_summarizer.summarize(
                    video_id=video_id,
                    title=title,
                    transcript_text=transcript.full_text,
                    url=url
                )

                if summary:
                    processed_data["videos"].append({
                        "video_id": summary.video_id,
                        "title": summary.title,
                        "url": summary.url,
                        "summary": summary.summary,
                        "categories": summary.categories,
                        "transcript_available": True,
                        "takeaways": summary.takeaways,
                        "fun_facts": summary.fun_facts
                    })
                else:
                    # Keep existing title-based summary
                    processed_data["videos"].append(video)
            else:
                # Still no transcript - keep title-based summary
                print(f"Still no transcript for {video_id}, keeping title-based summary")
                processed_data["videos"].append(video)

            save_processed_videos(processed_data)
            await asyncio.sleep(3.0)  # Longer delay to avoid IP blocks

        except Exception as e:
            print(f"Error reprocessing {video_id}: {e}")
            processed_data["videos"].append(video)

    _processing_status.is_processing = False
    _processing_status.processed = len(title_based_videos)
    _processing_status.current_video = None
    _processing_status.current_title = None

    save_processed_videos(processed_data)


# ============================================================================
# SEMANTIC SEARCH ON SUMMARIES
# ============================================================================

class SummarySearchRequest(BaseModel):
    """Request model for summary search."""
    query: str
    n_results: int = 10


class SummarySearchResult(BaseModel):
    """A single search result."""
    video_id: str
    title: str
    url: str
    summary: str
    categories: list[str]
    distance: float


class SummarySearchResponse(BaseModel):
    """Response model for summary search."""
    synthesis: str
    results: list[SummarySearchResult]


@router.post("/search-summaries", response_model=SummarySearchResponse)
async def search_summaries(request: SummarySearchRequest):
    """
    Semantic search across video summaries with AI synthesis.
    Searches all videos regardless of category filters.
    """
    if not config.OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")

    # Auto-index if needed
    data = load_processed_videos()
    videos = data.get("videos", [])
    videos_with_summaries = [
        v for v in videos
        if v.get("summary") and v["summary"] != "No summary available."
    ]

    if summary_store.needs_reindex(len(videos_with_summaries)):
        summary_store.index_all_summaries(videos)

    # Perform search
    result = summary_query.query(request.query, n_results=request.n_results)

    return SummarySearchResponse(
        synthesis=result["synthesis"],
        results=[
            SummarySearchResult(
                video_id=r["video_id"],
                title=r["title"],
                url=r["url"],
                summary=r["summary"],
                categories=r["categories"],
                distance=r["distance"],
            )
            for r in result["results"]
        ]
    )


@router.post("/reindex-summaries")
async def reindex_summaries():
    """Force reindex all video summaries."""
    data = load_processed_videos()
    videos = data.get("videos", [])

    # Clear and reindex
    summary_store.clear_all()
    count = summary_store.index_all_summaries(videos)

    return {"message": f"Indexed {count} summaries", "count": count}


@router.get("/summary-index-status")
async def get_summary_index_status():
    """Get summary index statistics."""
    data = load_processed_videos()
    videos = data.get("videos", [])
    videos_with_summaries = len([
        v for v in videos
        if v.get("summary") and v["summary"] != "No summary available."
    ])

    return {
        "indexed_count": summary_store.get_indexed_count(),
        "total_with_summaries": videos_with_summaries,
        "needs_reindex": summary_store.needs_reindex(videos_with_summaries),
    }


# ============================================================================
# GLOBAL INSIGHTS GENERATION
# ============================================================================

# Path to store generated insights
INSIGHTS_PATH = config.DATA_DIR / "global_insights.json"
# Path to store saved (favorited) insights
SAVED_INSIGHTS_PATH = config.DATA_DIR / "saved_insights.json"


class GenerateInsightsRequest(BaseModel):
    """Request model for generating insights."""
    num_insights: int = 10
    num_fun_facts: int = 10
    start_date: Optional[str] = None  # Format: YYYY-MM-DD
    end_date: Optional[str] = None    # Format: YYYY-MM-DD


class InsightItem(BaseModel):
    """A single insight or fun fact with source videos."""
    text: str
    source_ids: list[str] = []


class GlobalInsightsResponse(BaseModel):
    """Response model for global insights."""
    insights: list[InsightItem]
    fun_facts: list[InsightItem]
    generated_at: str
    video_count: int


def load_global_insights() -> dict:
    """Load saved global insights."""
    if not INSIGHTS_PATH.exists():
        return {}
    try:
        with open(INSIGHTS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Corrupted global_insights.json: {e}")
        return {}
    except OSError as e:
        logger.error(f"Failed to read global_insights.json: {e}")
        return {}


def save_global_insights(data: dict) -> None:
    """Save global insights to JSON file."""
    try:
        with open(INSIGHTS_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except OSError as e:
        logger.error(f"Failed to save global_insights.json: {e}")


def load_saved_insights() -> dict:
    """Load saved (favorited) insights."""
    if not SAVED_INSIGHTS_PATH.exists():
        return {"insights": [], "fun_facts": []}
    try:
        with open(SAVED_INSIGHTS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Corrupted saved_insights.json: {e}")
        return {"insights": [], "fun_facts": []}
    except OSError as e:
        logger.error(f"Failed to read saved_insights.json: {e}")
        return {"insights": [], "fun_facts": []}


def save_saved_insights(data: dict) -> None:
    """Save favorited insights to JSON file."""
    try:
        with open(SAVED_INSIGHTS_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except OSError as e:
        logger.error(f"Failed to save saved_insights.json: {e}")


@router.get("/insights")
async def get_insights():
    """Get previously generated global insights."""
    data = load_global_insights()
    if not data:
        return {"insights": [], "fun_facts": [], "generated_at": None, "video_count": 0}
    return data


def parse_date(date_str: str) -> Optional[str]:
    """Parse date string to comparable format (YYYY-MM-DD)."""
    if not date_str:
        return None
    # Handle various date formats
    for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d"]:
        try:
            from datetime import datetime as dt
            parsed = dt.strptime(date_str.split("T")[0], fmt)
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return date_str.split("T")[0] if "T" in date_str else date_str


def filter_videos_by_date(videos: list, start_date: Optional[str], end_date: Optional[str]) -> list:
    """Filter videos by date range."""
    if not start_date and not end_date:
        return videos

    filtered = []
    for video in videos:
        watched_at = video.get("watched_at", "")
        if not watched_at:
            continue

        video_date = parse_date(watched_at)
        if not video_date:
            continue

        if start_date and video_date < start_date:
            continue
        if end_date and video_date > end_date:
            continue

        filtered.append(video)

    return filtered


@router.post("/generate-insights", response_model=GlobalInsightsResponse)
async def generate_insights(request: GenerateInsightsRequest):
    """
    Generate global insights and fun facts from all processed videos.
    Analyzes all video summaries to extract key learnings and interesting facts.
    """
    if not config.OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")

    # Load all processed videos
    data = load_processed_videos()
    videos = data.get("videos", [])

    # Filter by date range if specified
    if request.start_date or request.end_date:
        videos = filter_videos_by_date(videos, request.start_date, request.end_date)

    if not videos:
        raise HTTPException(status_code=400, detail="No processed videos found in the selected date range")

    # Generate insights using the summarizer
    result = await video_summarizer.generate_global_insights(
        videos=videos,
        num_insights=request.num_insights,
        num_fun_facts=request.num_fun_facts
    )

    from datetime import datetime
    generated_at = datetime.now().isoformat()

    response_data = {
        "insights": result.get("insights", []),
        "fun_facts": result.get("fun_facts", []),
        "generated_at": generated_at,
        "video_count": len(videos)
    }

    # Save for future retrieval
    save_global_insights(response_data)

    return GlobalInsightsResponse(**response_data)


class DeleteInsightRequest(BaseModel):
    """Request to delete an insight."""
    type: str  # "insight" or "fun_fact"
    index: int


class SaveInsightRequest(BaseModel):
    """Request to save an insight."""
    type: str  # "insight" or "fun_fact"
    text: str
    source_ids: list[str] = []


@router.post("/insights/delete")
async def delete_insight(request: DeleteInsightRequest):
    """Delete an insight or fun fact from the generated list."""
    data = load_global_insights()
    if not data:
        raise HTTPException(status_code=404, detail="No insights found")

    key = "insights" if request.type == "insight" else "fun_facts"
    items = data.get(key, [])

    if request.index < 0 or request.index >= len(items):
        raise HTTPException(status_code=404, detail="Invalid index")

    # Remove the item
    items.pop(request.index)
    data[key] = items
    save_global_insights(data)

    return {"message": "Insight deleted", "type": request.type, "index": request.index}


@router.post("/insights/save")
async def save_insight(request: SaveInsightRequest):
    """Save an insight or fun fact to favorites."""
    saved = load_saved_insights()

    key = "insights" if request.type == "insight" else "fun_facts"
    if key not in saved:
        saved[key] = []

    # Check if already saved (by text match)
    for item in saved[key]:
        if isinstance(item, dict) and item.get("text") == request.text:
            return {"message": "Already saved", "type": request.type}
        if isinstance(item, str) and item == request.text:
            return {"message": "Already saved", "type": request.type}

    # Add to saved
    saved[key].append({
        "text": request.text,
        "source_ids": request.source_ids
    })
    save_saved_insights(saved)

    return {"message": "Insight saved", "type": request.type}


@router.get("/insights/saved")
async def get_saved_insights():
    """Get all saved insights and fun facts."""
    return load_saved_insights()


@router.post("/insights/saved/delete")
async def delete_saved_insight(request: DeleteInsightRequest):
    """Remove an insight or fun fact from saved list."""
    saved = load_saved_insights()

    key = "insights" if request.type == "insight" else "fun_facts"
    items = saved.get(key, [])

    if request.index < 0 or request.index >= len(items):
        raise HTTPException(status_code=404, detail="Invalid index")

    # Remove the item
    items.pop(request.index)
    saved[key] = items
    save_saved_insights(saved)

    return {"message": "Saved insight removed", "type": request.type, "index": request.index}


# ============================================================================
# CONNECTION THEME GENERATION
# ============================================================================

class ConnectionThemeRequest(BaseModel):
    """Request for generating connection theme."""
    source_id: str
    target_id: str


class ConnectionThemeResponse(BaseModel):
    """Response for connection theme."""
    source_id: str
    target_id: str
    common_topics: list[str]
    agreements: list[str] = []
    contradictions: list[str] = []
    similarity_score: float


@router.post("/connection-theme", response_model=ConnectionThemeResponse)
async def get_connection_theme(request: ConnectionThemeRequest):
    """
    Generate a theme explaining why two videos are connected.
    Uses AI to analyze both videos and explain their relationship.
    """
    if not config.OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")

    # Load processed videos
    data = load_processed_videos()
    videos = data.get("videos", [])

    # Find both videos
    video_lookup = {v["video_id"]: v for v in videos}
    source_video = video_lookup.get(request.source_id)
    target_video = video_lookup.get(request.target_id)

    # If videos not found in processed data, return a basic response
    if not source_video or not target_video:
        # Get video info from graph nodes if available
        connections_path = config.DATA_DIR / "connections.json"
        source_title = request.source_id
        target_title = request.target_id
        source_cats = []
        target_cats = []
        similarity = 0.5

        if connections_path.exists():
            with open(connections_path, "r", encoding="utf-8") as f:
                conn_data = json.load(f)
            nodes = {n["id"]: n for n in conn_data.get("graph", {}).get("nodes", [])}
            if request.source_id in nodes:
                source_title = nodes[request.source_id].get("title", request.source_id)
                source_cats = nodes[request.source_id].get("categories", [])
            if request.target_id in nodes:
                target_title = nodes[request.target_id].get("title", request.target_id)
                target_cats = nodes[request.target_id].get("categories", [])
            # Get similarity from edges
            for edge in conn_data.get("graph", {}).get("edges", []):
                if (edge["source"] == request.source_id and edge["target"] == request.target_id) or \
                   (edge["source"] == request.target_id and edge["target"] == request.source_id):
                    similarity = edge.get("weight", 0.5)
                    break

        # Find common categories
        common_cats = list(set(source_cats) & set(target_cats)) if source_cats and target_cats else ["Related Content"]

        return ConnectionThemeResponse(
            source_id=request.source_id,
            target_id=request.target_id,
            common_topics=common_cats if common_cats else ["Related Content"],
            agreements=[
                "Both videos are categorized under similar topics, indicating shared subject matter."
            ],
            contradictions=[
                "Detailed analysis unavailable - video summaries not yet processed."
            ],
            similarity_score=similarity
        )

    # Look up actual similarity score from precomputed connections
    similarity_score = 0.0
    connections_path = config.DATA_DIR / "connections.json"
    if connections_path.exists():
        with open(connections_path, "r", encoding="utf-8") as f:
            connections_data = json.load(f)
        # Check edges for this pair
        edges = connections_data.get("graph", {}).get("edges", [])
        for edge in edges:
            if (edge["source"] == request.source_id and edge["target"] == request.target_id) or \
               (edge["source"] == request.target_id and edge["target"] == request.source_id):
                similarity_score = edge.get("weight", 0.0)
                break

    # Generate connection theme
    result = await video_summarizer.generate_connection_theme(
        source_video=source_video,
        target_video=target_video,
        similarity_score=similarity_score
    )

    return ConnectionThemeResponse(
        source_id=request.source_id,
        target_id=request.target_id,
        common_topics=result.get("common_topics", []),
        agreements=result.get("agreements", []),
        contradictions=result.get("contradictions", []),
        similarity_score=result.get("similarity_score", 0.0)
    )
