"""Fetch YouTube video transcripts with caching."""
import json
import time
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, asdict

from youtube_transcript_api import YouTubeTranscriptApi

import config


@dataclass
class TranscriptSegment:
    """A single transcript segment."""
    text: str
    start: float
    duration: float


@dataclass
class Transcript:
    """A video transcript."""
    video_id: str
    language: str
    is_generated: bool
    segments: list[TranscriptSegment]

    @property
    def full_text(self) -> str:
        """Get full transcript text."""
        return " ".join(seg.text for seg in self.segments)

    def to_dict(self) -> dict:
        return {
            "video_id": self.video_id,
            "language": self.language,
            "is_generated": self.is_generated,
            "segments": [asdict(seg) for seg in self.segments],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Transcript":
        segments = [TranscriptSegment(**seg) for seg in data["segments"]]
        return cls(
            video_id=data["video_id"],
            language=data["language"],
            is_generated=data["is_generated"],
            segments=segments,
        )


class TranscriptFetcher:
    """Fetch and cache YouTube transcripts."""

    def __init__(self, cache_dir: Optional[Path] = None):
        self.cache_dir = cache_dir or config.TRANSCRIPTS_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.api = YouTubeTranscriptApi()
        self._rate_limit_delay = 0.5  # seconds between requests

    def _cache_path(self, video_id: str) -> Path:
        return self.cache_dir / f"{video_id}.json"

    def _load_from_cache(self, video_id: str) -> Optional[Transcript]:
        cache_file = self._cache_path(video_id)
        if cache_file.exists():
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return Transcript.from_dict(data)
        return None

    def _save_to_cache(self, transcript: Transcript) -> None:
        cache_file = self._cache_path(transcript.video_id)
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(transcript.to_dict(), f, ensure_ascii=False, indent=2)

    def fetch(self, video_id: str, languages: list[str] = None) -> Optional[Transcript]:
        """
        Fetch transcript for a video.

        Args:
            video_id: YouTube video ID
            languages: Preferred languages in order (default: ["en"])

        Returns:
            Transcript object or None if unavailable
        """
        # Check cache first
        cached = self._load_from_cache(video_id)
        if cached:
            return cached

        languages = languages or ["en"]

        try:
            # Use the new API - fetch() returns a FetchedTranscript directly
            fetched = self.api.fetch(video_id, languages=languages)

            # Convert to our format
            segments = [
                TranscriptSegment(
                    text=seg.text,
                    start=seg.start,
                    duration=seg.duration,
                )
                for seg in fetched.snippets
            ]

            result = Transcript(
                video_id=video_id,
                language=fetched.language,
                is_generated=fetched.is_generated,
                segments=segments,
            )

            # Cache result
            self._save_to_cache(result)

            # Rate limiting
            time.sleep(self._rate_limit_delay)

            return result

        except Exception as e:
            print(f"Error fetching transcript for {video_id}: {e}")
            return None

    def fetch_batch(
        self,
        video_ids: list[str],
        languages: list[str] = None,
        on_progress: callable = None,
    ) -> dict[str, Optional[Transcript]]:
        """
        Fetch transcripts for multiple videos.

        Args:
            video_ids: List of video IDs
            languages: Preferred languages
            on_progress: Callback(current, total, video_id, success)

        Returns:
            Dict mapping video_id to Transcript (or None if unavailable)
        """
        results = {}
        total = len(video_ids)

        for i, video_id in enumerate(video_ids):
            transcript = self.fetch(video_id, languages)
            results[video_id] = transcript

            if on_progress:
                on_progress(i + 1, total, video_id, transcript is not None)

        return results
