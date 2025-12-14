"""Parse Google Takeout watch-history.json files."""
import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional


@dataclass
class WatchHistoryEntry:
    """A single watch history entry."""
    video_id: str
    title: str
    channel_name: Optional[str]
    channel_url: Optional[str]
    watched_at: datetime
    url: str

    def to_dict(self) -> dict:
        return {
            "video_id": self.video_id,
            "title": self.title,
            "channel_name": self.channel_name,
            "channel_url": self.channel_url,
            "watched_at": self.watched_at.isoformat(),
            "url": self.url,
        }


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


def parse_watch_history(file_path: Path) -> list[WatchHistoryEntry]:
    """
    Parse a Google Takeout watch-history.json file.

    Expected format:
    [
        {
            "header": "YouTube",
            "title": "Watched Video Title",
            "titleUrl": "https://www.youtube.com/watch?v=...",
            "subtitles": [
                {
                    "name": "Channel Name",
                    "url": "https://www.youtube.com/channel/..."
                }
            ],
            "time": "2024-01-01T12:00:00.000Z",
            "products": ["YouTube"]
        }
    ]
    """
    entries = []

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for item in data:
        # Skip non-watch entries
        if item.get("header") != "YouTube":
            continue

        title = item.get("title", "")
        # Remove "Watched " prefix if present
        if title.startswith("Watched "):
            title = title[8:]

        url = item.get("titleUrl", "")
        video_id = extract_video_id(url)

        # Skip entries without valid video ID (e.g., deleted videos)
        if not video_id:
            continue

        # Parse channel info
        subtitles = item.get("subtitles", [])
        channel_name = None
        channel_url = None
        if subtitles:
            channel_name = subtitles[0].get("name")
            channel_url = subtitles[0].get("url")

        # Parse timestamp
        time_str = item.get("time", "")
        try:
            watched_at = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
        except ValueError:
            continue

        entry = WatchHistoryEntry(
            video_id=video_id,
            title=title,
            channel_name=channel_name,
            channel_url=channel_url,
            watched_at=watched_at,
            url=url,
        )
        entries.append(entry)

    return entries


def get_unique_video_ids(entries: list[WatchHistoryEntry]) -> list[str]:
    """Get unique video IDs from watch history entries."""
    seen = set()
    unique_ids = []
    for entry in entries:
        if entry.video_id not in seen:
            seen.add(entry.video_id)
            unique_ids.append(entry.video_id)
    return unique_ids
