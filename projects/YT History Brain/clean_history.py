#!/usr/bin/env python3
"""Aggressively filter Takeout watch history for non-entertainment videos."""

import json
import os
import re
from datetime import datetime
from pathlib import Path
from html import unescape
from typing import Optional, List, Dict


START_DATE = datetime(2025, 10, 1)
# Use relative path from this file's location
ROOT_DIR = Path(__file__).parent.resolve()
# Takeout path can be overridden via environment variable
TAKEOUT_HTML = Path(os.getenv(
    "TAKEOUT_HTML_PATH",
    str(Path.home() / "Downloads/Takeout/YouTube and YouTube Music/history/watch-history.html")
))
WATCH_HISTORY_PATH = ROOT_DIR / "watch_history.json"
PROCESSED_PATH = ROOT_DIR / "data" / "processed_videos.json"
SHORT_KEYWORDS = [
    "#short",
    "#shorts",
    " shorts",
    " short ",
    "short-form",
    "short form",
    "short video",
    "shorts video",
    "short clip",
    "short clips",
    "short feed",
    "shortfeed",
    "shortsfeed",
    "youtube shorts",
    "yt shorts",
    "pov",
    "p.o.v",
    "#pov",
    "#fyp",
    "#fypp",
    "#fyppp",
    "#viral",
]
SHORT_HASHTAG_KEYWORDS = [
    "short",
    "shorts",
    "pov",
    "fyp",
    "fypp",
    "fyppp",
    "viral",
    "clip",
]
SHORT_CHANNEL_KEYWORDS = [
    "shorts",
    "short ",
    " shorts",
    "shortfeed",
    "short comment",
    "clips",
    "clipz",
    "moments",
    "highlights",
    "daily dose",
    "daily short",
    "short videos",
    "pov",
]


def parse_timestamp(timestamp_str: str) -> Optional[datetime]:
    clean_ts = re.sub(r'\s+[A-Z]{2,4}$', '', timestamp_str.strip())
    try:
        return datetime.strptime(clean_ts, "%b %d, %Y, %I:%M:%S %p")
    except ValueError:
        return None


def extract_videos_from_html(html_content: str) -> List[Dict]:
    videos = []
    entries = re.split(r'<div class="outer-cell[^>]*>', html_content)

    for entry in entries[1:]:
        video = {}

        # Check platform
        platform_match = re.search(r'<p class="mdl-typography--title">([^<]+)<br>', entry)
        if platform_match:
            platform_text = platform_match.group(1).strip()
            if "YouTube Music" in platform_text:
                video["platform"] = "YouTube Music"
            elif "YouTube" in platform_text:
                video["platform"] = "YouTube"

        # Extract URL
        url_match = re.search(r'Watched[\s\xa0]+<a href="(https?://(?:www\.)?(?:youtube\.com|music\.youtube\.com)/watch\?v=[^"]+)"', entry)
        if url_match:
            video["url"] = url_match.group(1)
            vid_match = re.search(r'[?&]v=([a-zA-Z0-9_-]+)', video["url"])
            if vid_match:
                video["video_id"] = vid_match.group(1)

        # Extract title
        title_match = re.search(r'Watched[\s\xa0]+<a href="[^"]+">([^<]+)</a>', entry)
        if title_match:
            video["title"] = unescape(title_match.group(1))

        # Extract channel
        channel_match = re.search(r'</a><br><a href="https://www\.youtube\.com/channel/[^"]+">([^<]+)</a>', entry)
        if channel_match:
            video["channel"] = unescape(channel_match.group(1))

        # Extract timestamp
        ts_match = re.search(r'<br>([A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2}:\d{2}[\s\u202f]+[AP]M[\s\u202f]+[A-Z]+)<br>', entry)
        if ts_match:
            ts_str = ts_match.group(1).replace('\u202f', ' ').replace('\xa0', ' ')
            video["timestamp_str"] = ts_str
            video["timestamp"] = parse_timestamp(ts_str)

        if video.get("video_id") and video.get("platform") and video.get("timestamp"):
            videos.append(video)

    return videos


def is_music_or_entertainment(title: str, channel: str = "") -> bool:
    """AGGRESSIVELY detect if a video is music or entertainment related."""
    title_lower = title.lower()
    channel_lower = channel.lower() if channel else ""

    # === INSTANT REJECT PATTERNS ===

    # Chinese/Japanese/Korean characters with music patterns
    cjk_music_patterns = [
        '音乐', '音樂', '歌曲', '歌', '唱', '演唱', '翻唱', '原唱',
        '纯享', '純享', '歌手', '声生不息', '天赐的声音', '我是歌手',
        '中国好声音', '蒙面唱将', '跨界歌王', '好声音',
        '主題曲', '主题曲', '片尾曲', '插曲', '配乐', '原声',
        '音樂會', '音乐会', '演唱會', '演唱会', 'live版', 'LIVE版',
        '独唱', '合唱', '抒情', '情歌', '民謠', '民谣', '搖滾', '摇滚',
        '嘻哈', '说唱', '饒舌', '专辑', '單曲', '单曲', '新歌',
        '歌词', '吉他', '钢琴', '鋼琴', '旋律', '曲', '樂',
        '노래', '음악', '라이브', '콘서트', '가수', '앨범',
        '【', '】',  # Chinese brackets often used for music/entertainment
        '《', '》',  # Chinese angle brackets for song titles
    ]

    for pattern in cjk_music_patterns:
        if pattern in title:
            return True

    # Music keywords (word boundary matching)
    music_keywords = [
        'music', 'song', 'songs', 'singing', 'singer', 'singers', 'sing',
        'cover', 'covers', 'covered', 'acoustic', 'unplugged',
        'lyric', 'lyrics', 'karaoke', 'letra',
        'remix', 'remixes', 'remixed', 'mashup', 'mashups',
        'album', 'albums', 'ep', 'playlist', 'playlists',
        'concert', 'concerts',
        'soundtrack', 'soundtracks', 'ost', 'bgm', 'score',
        'instrumental', 'instrumentals', 'acapella', 'a capella',
        'piano', 'guitar', 'drums', 'bass', 'violin', 'cello', 'saxophone',
        'orchestra', 'symphony', 'symphonic', 'choir', 'choral',
        'vocal', 'vocals', 'vocalist', 'duet', 'trio', 'quartet',
        'edm', 'hip-hop', 'hiphop', 'r&b', 'rnb', 'jazz', 'blues',
        'rock', 'metal', 'punk', 'pop', 'indie', 'alternative',
        'classical', 'opera', 'operatic', 'folk', 'reggae', 'ska',
        'electronic', 'techno', 'house', 'trance', 'dubstep',
        'lo-fi', 'lofi', 'vevo', 'k-pop', 'kpop', 'j-pop', 'jpop',
        'ballad', 'ballads', 'anthem', 'hymn',
        'band', 'bands', 'rapper', 'rappers', 'dj',
        'melody', 'melodies', 'melodic', 'harmonic', 'harmony',
        'beat', 'beats', 'rhythm', 'rhythmic', 'groove',
        'verse', 'chorus', 'bridge', 'hook', 'drop',
        'bpm', 'tempo', 'key of', 'minor', 'major',
    ]

    for kw in music_keywords:
        if re.search(r'\b' + re.escape(kw) + r'\b', title_lower):
            return True

    # Music phrases
    music_phrases = [
        'live performance', 'live session', 'live at', 'live from',
        'official video', 'official audio', 'official music', 'official mv',
        'music video', 'audio only', 'visualizer', 'lyric video',
        'feat.', 'feat ', 'featuring', ' ft ', ' ft.', ' f/ ',
        'prod.', 'prod by', 'produced by',
        'chill beats', 'study music', 'sleep music', 'relaxing music',
        'full album', 'new album', 'debut album',
        'music show', 'award show', 'awards show',
        'top hits', 'best songs', 'greatest hits',
    ]

    for phrase in music_phrases:
        if phrase in title_lower:
            return True

    # Entertainment keywords
    entertainment_keywords = [
        'react', 'reacts', 'reaction', 'reactions', 'reacting',
        'prank', 'pranks', 'pranked', 'pranking',
        'challenge', 'challenges', 'challenged',
        'vlog', 'vlogs', 'vlogger', 'vloggers',
        'mukbang', 'asmr',
        'unboxing', 'haul', 'hauls',
        'skit', 'skits', 'comedy', 'comedian', 'comedians',
        'parody', 'parodies', 'spoof',
        'tiktok', 'tiktoker', 'tiktokers',
        'influencer', 'influencers',
        'celebrity', 'celebrities', 'celeb', 'celebs',
        'drama', 'dramas', 'k-drama', 'kdrama',
        'variety show', 'game show', 'talk show', 'late night',
        'viral', 'trending', 'gone wrong', 'goes wrong',
        'caught on camera', 'you wont believe',
        'satisfying', 'oddly satisfying',
        'compilation', 'compilations', 'best of', 'top 10', 'top ten',
        'meme', 'memes', 'funny', 'hilarious', 'lol', 'lmao',
        'cringe', 'cringey', 'awkward',
        'wtf', 'omg', 'shocking', 'insane', 'crazy',
        'drama', 'beef', 'exposed', 'cancelled', 'canceled',
        'storytime', 'story time', 'tea', 'spill',
        'lifestyle', 'beauty', 'makeup', 'glam', 'haul',
        'gossip', 'wag', 'wags', 'wife', 'girlfriend', 'boyfriend',
        'fyp', 'foryou', 'foryoupage', 'fyppp', 'fypp', 'fypシ',
        '#fyp', '#fy', '#foryou', '#foryoupage', '#fyppp', '#fypp',
        '#viral', '#goviral', '#trend', '#trending',
    ]

    for kw in entertainment_keywords:
        if re.search(r'\b' + re.escape(kw) + r'\b', title_lower):
            return True

    # MV patterns
    if re.search(r'\bM/?V\b', title, re.IGNORECASE):
        return True

    # Official patterns often indicate music
    if re.search(r'official\s*(video|audio|lyric|visualizer|mv)', title_lower):
        return True

    # Parentheses with music/entertainment terms
    if re.search(r'\((official|lyric|audio|live|acoustic|cover|remix|version|reaction|prank)\)', title_lower):
        return True

    # Short titles with dash (likely "Artist - Song")
    # Only match if both sides are short and look like names
    if re.match(r'^[A-Za-z\s]{2,20}\s*[-–—]\s*[A-Za-z\s\'"]{2,30}$', title):
        # Additional check: if title is very short and has this pattern, likely music
        if len(title) < 50:
            return True

    # === CHANNEL-BASED FILTERS ===

    music_channels = [
        'vevo', 'records', 'recording', 'recordings',
        'emi', 'sony music', 'universal music', 'warner music',
        'atlantic', 'interscope', 'republic', 'capitol',
        'def jam', 'rca', 'columbia', 'island', 'geffen',
        '- topic',  # YouTube auto-generated
        'entertainment', 'ent.', 'ent ',
        'sm entertainment', 'jyp', 'yg entertainment', 'hybe', 'bighit',
    ]

    for ch in music_channels:
        if ch in channel_lower:
            return True

    entertainment_channels = [
        'family', 'vlogs', 'shorts', 'clips', 'tv', 'show', 'inside',
        'highlights', 'wag', 'gossip', 'buzz', 'news', 'funny', 'comedy'
    ]

    for ch in entertainment_channels:
        if ch in channel_lower:
            return True

    return False


def is_short_video(title: str, channel: str = "") -> bool:
    """Detect if a video is likely a YouTube Shorts clip."""
    title_lower = title.lower()
    channel_lower = channel.lower() if channel else ""

    if any(keyword in title_lower for keyword in SHORT_KEYWORDS):
        return True

    if title_lower.startswith("pov") or title_lower.startswith("p.o.v"):
        return True

    hashtag_tokens = [token.strip(".,!?;:") for token in title_lower.split() if token.startswith("#")]
    if hashtag_tokens:
        ascii_tags = [tag for tag in hashtag_tokens if tag.isascii()]
        if any(any(key in tag for key in SHORT_HASHTAG_KEYWORDS) for tag in ascii_tags):
            return True
        if len(ascii_tags) >= 3 and len(title) <= 90:
            return True

    if any(keyword in channel_lower for keyword in SHORT_CHANNEL_KEYWORDS):
        return True

    return False


def main():
    if not TAKEOUT_HTML.exists():
        raise FileNotFoundError(f"Takeout HTML not found: {TAKEOUT_HTML}")

    print(f"Reading Takeout HTML from {TAKEOUT_HTML}...")
    with open(TAKEOUT_HTML, "r", encoding="utf-8") as f:
        html_content = f.read()

    print("Extracting videos...")
    all_videos = extract_videos_from_html(html_content)
    print(f"Total videos in Takeout: {len(all_videos)}")

    recent_videos = [v for v in all_videos if v.get("timestamp") and v["timestamp"] >= START_DATE]
    print(f"Videos from {START_DATE.strftime('%b %Y')} onwards: {len(recent_videos)}")

    # Exclude YouTube Music platform entirely
    youtube_only = [v for v in recent_videos if v.get("platform") == "YouTube"]
    print(f"After excluding YouTube Music platform: {len(youtube_only)}")

    # Aggressively filter out music AND entertainment videos
    clean_videos = []
    filtered_out = []
    short_videos = []

    for v in youtube_only:
        title = v.get("title", "")
        channel = v.get("channel", "")

        if is_short_video(title, channel):
            short_videos.append(v)
            continue

        if is_music_or_entertainment(title, channel):
            filtered_out.append(v)
        else:
            clean_videos.append(v)

    print(f"Filtered out YouTube Shorts: {len(short_videos)}")
    print(f"Filtered out (music/entertainment): {len(filtered_out)}")
    print(f"Clean videos: {len(clean_videos)}")

    # Show samples
    print("\n=== SAMPLE SHORTS (removed) ===")
    for v in short_videos[:15]:
        print(f"  - {v.get('title', '')[:70]}")

    print("\n=== SAMPLE FILTERED (should be music/entertainment) ===")
    for v in filtered_out[:15]:
        print(f"  - {v.get('title', '')[:70]}")

    print("\n=== SAMPLE KEPT (should be tech/edu/business) ===")
    for v in clean_videos[:20]:
        print(f"  - {v.get('title', '')[:70]}")

    # Deduplicate by video ID
    seen_ids = set()
    unique_videos = []
    for v in clean_videos:
        vid = v.get("video_id")
        if vid and vid not in seen_ids:
            seen_ids.add(vid)
            unique_videos.append(v)

    print(f"\nAfter deduplication: {len(unique_videos)} unique videos")

    # Normalize URLs and create placeholder processed entries
    clean_urls = []
    processed_entries = []
    for v in unique_videos:
        url = v.get("url", "").replace("music.youtube.com", "www.youtube.com")
        clean_urls.append(url)
        processed_entries.append({
            "video_id": v.get("video_id"),
            "title": v.get("title", ""),
            "url": url,
            "summary": "",
            "categories": [],
            "transcript_available": False,
            "watched_at": v.get("timestamp").isoformat() if v.get("timestamp") else None,
        })

    # Save
    with open(WATCH_HISTORY_PATH, "w") as f:
        json.dump({"watch_history": clean_urls}, f, indent=2)

    with open(PROCESSED_PATH, "w", encoding="utf-8") as f:
        json.dump({"videos": processed_entries}, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(clean_urls)} clean URLs to watch_history.json")
    print(f"Saved {len(processed_entries)} placeholder entries to data/processed_videos.json")


if __name__ == "__main__":
    main()
