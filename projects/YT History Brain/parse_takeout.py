#!/usr/bin/env python3
"""
Parse Google Takeout watch-history.html and add Music videos from July 2025+ to existing history.

Since the HTML only distinguishes YouTube vs YouTube Music (no "Entertainment" category),
we'll keep YouTube Music videos as they're clearly music content.
"""

import json
import re
from datetime import datetime
from pathlib import Path
from html import unescape
from typing import Optional, List, Dict


def parse_timestamp(timestamp_str: str) -> Optional[datetime]:
    """Parse timestamp like 'Nov 16, 2025, 2:29:18 AM PST' to datetime."""
    # Remove timezone abbreviation for parsing
    clean_ts = re.sub(r'\s+[A-Z]{2,4}$', '', timestamp_str.strip())
    try:
        return datetime.strptime(clean_ts, "%b %d, %Y, %I:%M:%S %p")
    except ValueError:
        return None


def extract_videos_from_html(html_content: str) -> List[Dict]:
    """Extract video entries using regex on the HTML content."""
    videos = []

    # Pattern to match each outer-cell div containing a video entry
    # Each entry has:
    # 1. Platform in header: "YouTube" or "YouTube Music"
    # 2. Video URL and title
    # 3. Timestamp

    # Split by outer-cell to process each entry
    entries = re.split(r'<div class="outer-cell[^>]*>', html_content)

    for entry in entries[1:]:  # Skip first empty split
        video = {}

        # Check platform (YouTube Music vs YouTube)
        platform_match = re.search(r'<p class="mdl-typography--title">([^<]+)<br>', entry)
        if platform_match:
            platform_text = platform_match.group(1).strip()
            if "YouTube Music" in platform_text:
                video["platform"] = "YouTube Music"
            elif "YouTube" in platform_text:
                video["platform"] = "YouTube"

        # Extract video URL - can be youtube.com or music.youtube.com
        # Note: There may be non-breaking spaces (\xa0) instead of regular spaces
        url_match = re.search(r'Watched[\s\xa0]+<a href="(https?://(?:www\.)?(?:youtube\.com|music\.youtube\.com)/watch\?v=[^"]+)"', entry)
        if url_match:
            video["url"] = url_match.group(1)
            # Extract video ID
            vid_match = re.search(r'[?&]v=([a-zA-Z0-9_-]+)', video["url"])
            if vid_match:
                video["video_id"] = vid_match.group(1)

        # Extract title
        title_match = re.search(r'Watched[\s\xa0]+<a href="[^"]+">([^<]+)</a>', entry)
        if title_match:
            video["title"] = unescape(title_match.group(1))

        # Extract timestamp - format: "Nov 16, 2025, 2:29:18 AM PST"
        # Note: There may be narrow non-breaking spaces (\u202f) between time components
        ts_match = re.search(r'<br>([A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2}:\d{2}[\s\u202f]+[AP]M[\s\u202f]+[A-Z]+)<br>', entry)
        if ts_match:
            # Normalize spaces for parsing
            ts_str = ts_match.group(1).replace('\u202f', ' ').replace('\xa0', ' ')
            video["timestamp_str"] = ts_str
            video["timestamp"] = parse_timestamp(ts_str)

        # Only add if we have the essential fields
        if video.get("video_id") and video.get("platform") and video.get("timestamp"):
            videos.append(video)

    return videos


def main():
    # Paths
    takeout_path = Path("/Users/jackshen/Downloads/Takeout/YouTube and YouTube Music/history/watch-history.html")
    history_path = Path("/Users/jackshen/Desktop/personal-website/projects/YT History Brain/watch_history.json")

    # Load existing history
    with open(history_path, "r") as f:
        existing_data = json.load(f)

    existing_urls = set(existing_data.get("watch_history", []))
    existing_video_ids = set()
    for url in existing_urls:
        match = re.search(r'[?&]v=([a-zA-Z0-9_-]+)', url)
        if match:
            existing_video_ids.add(match.group(1))

    print(f"Existing history has {len(existing_urls)} URLs ({len(existing_video_ids)} unique video IDs)")

    # Read HTML
    print(f"Reading {takeout_path}...")
    with open(takeout_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    print(f"HTML file size: {len(html_content) / 1024 / 1024:.2f} MB")

    # Parse videos
    print("Extracting videos from HTML...")
    all_videos = extract_videos_from_html(html_content)
    print(f"Found {len(all_videos)} total video entries in Takeout")

    # Filter for July 2025 onwards
    july_2025 = datetime(2025, 7, 1)
    filtered_videos = [v for v in all_videos if v.get("timestamp") and v["timestamp"] >= july_2025]

    print(f"Videos from July 2025 onwards: {len(filtered_videos)}")

    # Count by platform
    music_videos = [v for v in filtered_videos if v.get("platform") == "YouTube Music"]
    youtube_videos = [v for v in filtered_videos if v.get("platform") == "YouTube"]

    print(f"  - YouTube Music: {len(music_videos)}")
    print(f"  - YouTube (regular): {len(youtube_videos)}")

    # Filter for NON-music videos (regular YouTube, not YouTube Music)
    # Also filter out videos with music-related keywords in titles
    music_keywords = [
        # English keywords
        'cover', 'song', 'music', 'mv', 'official video', 'official audio',
        'lyric', 'lyrics', 'acoustic', 'live performance', 'concert',
        'remix', 'ft.', 'feat.', 'featuring', 'album', 'playlist',
        'vevo', 'official music', 'music video', 'audio', 'instrumental',
        'karaoke', 'singing', 'singer', 'vocal', 'choir', 'band',
        'orchestra', 'symphony', 'asmr music', 'lo-fi', 'lofi',
        'chill beats', 'soundtrack', 'ost', 'bgm', 'edm', 'rap', 'hip hop',
        'pop', 'rock', 'jazz', 'classical', 'piano', 'guitar',
        # Chinese keywords
        '纯享', '歌曲', '音乐', '翻唱', '演唱', '独唱', '合唱',
        '声生不息', '天赐的声音', '主題曲', '主题曲', '片尾曲',
        '插曲', 'live版', 'LIVE版', '音樂會', '音乐会', '演唱會',
        '演唱会', '鄧紫棋', 'G.E.M', '歌手', '唱歌', '歌词',
        '原唱', '新歌', '专辑', '單曲', '单曲', '抒情', '情歌',
        '民謠', '民谣', '搖滾', '摇滚', '嘻哈', '说唱', '饒舌',
        # Korean keywords
        '노래', '음악', '라이브', '콘서트',
        # Common patterns
        'MV', 'M/V'
    ]

    def is_music_related(title: str) -> bool:
        title_lower = title.lower()
        for kw in music_keywords:
            if kw.lower() in title_lower:
                return True
        return False

    non_music = [v for v in youtube_videos if not is_music_related(v.get("title", ""))]
    filtered_out = len(youtube_videos) - len(non_music)

    print(f"\nFiltering for regular YouTube (non-music) entries:")
    print(f"  - Before keyword filter: {len(youtube_videos)}")
    print(f"  - Filtered out (music keywords): {filtered_out}")
    print(f"  - After filter: {len(non_music)} videos")

    # Find new videos not in existing history
    new_videos = []
    for video in non_music:
        video_id = video.get("video_id")
        if video_id and video_id not in existing_video_ids:
            new_videos.append(video)

    print(f"New videos to add: {len(new_videos)}")

    if new_videos:
        # Show sample of new videos
        print("\nSample of new videos to add:")
        for v in new_videos[:10]:
            title = v.get('title', 'Unknown')
            if len(title) > 50:
                title = title[:47] + "..."
            print(f"  - {title} ({v.get('timestamp_str', '')})")
        if len(new_videos) > 10:
            print(f"  ... and {len(new_videos) - 10} more")

    # Add new videos to history
    new_urls = []
    for video in new_videos:
        url = video.get("url")
        if url:
            # Normalize URL to youtube.com format
            if "music.youtube.com" in url:
                url = url.replace("music.youtube.com", "www.youtube.com")
            new_urls.append(url)

    # Update history
    updated_history = list(existing_data.get("watch_history", []))
    updated_history.extend(new_urls)

    # Save updated history
    output_data = {"watch_history": updated_history}
    with open(history_path, "w") as f:
        json.dump(output_data, f, indent=2)

    print(f"\nUpdated history saved!")
    print(f"Previous count: {len(existing_urls)}")
    print(f"New videos added: {len(new_urls)}")
    print(f"New total: {len(updated_history)}")


if __name__ == "__main__":
    main()
