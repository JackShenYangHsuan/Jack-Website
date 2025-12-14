"""Scheduled jobs for automatic syncing."""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

import config
from scraper.parser import parse_watch_history, get_unique_video_ids
from scraper.takeout import TakeoutScraper
from transcripts.fetcher import TranscriptFetcher
from rag.vectorstore import VectorStore


scheduler = AsyncIOScheduler()


async def sync_job():
    """
    Main sync job that:
    1. Triggers Google Takeout export (if automation enabled)
    2. Parses watch history
    3. Fetches missing transcripts
    4. Indexes new content
    """
    print("Starting scheduled sync...")

    vectorstore = VectorStore()
    fetcher = TranscriptFetcher()

    # Check for watch history file
    history_file = config.TAKEOUT_DIR / "watch-history.json"

    if not history_file.exists():
        print("No watch history file found. Skipping sync.")
        return

    # Parse watch history
    entries = parse_watch_history(history_file)
    unique_ids = get_unique_video_ids(entries)

    # Filter out already indexed
    new_ids = [vid for vid in unique_ids if not vectorstore.has_video(vid)]

    if not new_ids:
        print("No new videos to index.")
        return

    print(f"Found {len(new_ids)} new videos to process")

    # Create entry lookup
    entry_lookup = {e.video_id: e for e in entries}

    success = 0
    failed = 0

    for video_id in new_ids:
        transcript = fetcher.fetch(video_id)

        if transcript:
            # Chunk text
            full_text = transcript.full_text
            words = full_text.split()
            chunks = []
            start = 0
            while start < len(words):
                end = start + config.CHUNK_SIZE
                chunk = " ".join(words[start:end])
                chunks.append(chunk)
                start = end - config.CHUNK_OVERLAP

            entry = entry_lookup.get(video_id)
            metadata = {
                "title": entry.title if entry else "",
                "channel": entry.channel_name if entry else "",
                "watched_at": entry.watched_at.isoformat() if entry else "",
            }

            vectorstore.add_transcript(video_id, chunks, metadata)
            success += 1
        else:
            failed += 1

    print(f"Sync complete: {success} indexed, {failed} failed")


def start_scheduler():
    """Start the background scheduler."""
    # Parse cron schedule from config
    cron_parts = config.SYNC_SCHEDULE.split()
    if len(cron_parts) == 5:
        trigger = CronTrigger(
            minute=cron_parts[0],
            hour=cron_parts[1],
            day=cron_parts[2],
            month=cron_parts[3],
            day_of_week=cron_parts[4],
        )
    else:
        # Default: daily at 3am
        trigger = CronTrigger(hour=3, minute=0)

    scheduler.add_job(sync_job, trigger, id="daily_sync")
    scheduler.start()

    print(f"Scheduler started with schedule: {config.SYNC_SCHEDULE}")


def stop_scheduler():
    """Stop the scheduler."""
    scheduler.shutdown()
