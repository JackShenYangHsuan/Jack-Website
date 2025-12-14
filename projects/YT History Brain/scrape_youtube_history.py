#!/usr/bin/env python3
"""
Scrape YouTube watch history directly using Playwright.
"""
import asyncio
import json
import re
import sys
from pathlib import Path
from datetime import datetime

from playwright.async_api import async_playwright

# Paths
PROJECT_DIR = Path(__file__).parent
DATA_DIR = PROJECT_DIR / "data"
TAKEOUT_DIR = DATA_DIR / "takeout"
USER_DATA_DIR = DATA_DIR / "browser_profile"

TAKEOUT_DIR.mkdir(parents=True, exist_ok=True)
USER_DATA_DIR.mkdir(parents=True, exist_ok=True)


async def scrape_youtube_history(max_scroll: int = 50):
    print("Opening YouTube history page...")
    print("If you need to log in, do so in the browser window.\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            user_data_dir=str(USER_DATA_DIR),
            headless=False,
            viewport={"width": 1280, "height": 900},
        )
        page = browser.pages[0] if browser.pages else await browser.new_page()

        try:
            await page.goto("https://www.youtube.com/feed/history")

            # Wait for either login redirect or history content
            print("Waiting for page to load (log in if needed)...")

            # Give user time to log in if needed
            for i in range(60):  # Wait up to 60 seconds
                await asyncio.sleep(1)
                url = page.url

                # Check if we're on the history page with content
                if "feed/history" in url:
                    # Check for video content
                    has_videos = await page.evaluate("""
                        () => document.querySelectorAll('a[href*="/watch?v="]').length > 0
                    """)
                    if has_videos:
                        print("History page loaded with videos!")
                        break

                if i % 10 == 0 and i > 0:
                    print(f"  Still waiting... ({i}s) - log in if you haven't")

            await asyncio.sleep(2)

            # Start scraping
            print("\nScraping watch history...")
            videos = []
            seen_ids = set()
            last_count = 0
            no_new_count = 0

            for scroll_num in range(max_scroll):
                # Get all video links
                links = await page.evaluate("""
                    () => {
                        const results = [];
                        const anchors = document.querySelectorAll('a[href*="/watch?v="]');

                        for (const a of anchors) {
                            const href = a.href || a.getAttribute('href') || '';
                            let title = a.title || a.getAttribute('aria-label') || '';

                            // Try to get title from nearby elements if not found
                            if (!title || title.length < 3) {
                                const parent = a.closest('ytd-video-renderer, ytd-compact-video-renderer, [class*="video"]');
                                if (parent) {
                                    const titleEl = parent.querySelector('#video-title, [id*="title"], .title');
                                    if (titleEl) {
                                        title = titleEl.title || titleEl.textContent?.trim() || '';
                                    }
                                }
                            }

                            // Also try text content
                            if (!title || title.length < 3) {
                                title = a.textContent?.trim() || '';
                            }

                            if (href.includes('/watch?v=') && title && title.length > 2) {
                                results.push({ href, title });
                            }
                        }
                        return results;
                    }
                """)

                for item in links:
                    match = re.search(r"v=([a-zA-Z0-9_-]{11})", item['href'])
                    if match:
                        video_id = match.group(1)
                        if video_id not in seen_ids:
                            seen_ids.add(video_id)
                            videos.append({
                                "header": "YouTube",
                                "title": f"Watched {item['title']}",
                                "titleUrl": f"https://www.youtube.com/watch?v={video_id}",
                                "subtitles": [],
                                "time": datetime.now().isoformat() + "Z",
                                "products": ["YouTube"]
                            })

                new_count = len(videos)
                if new_count > last_count:
                    print(f"  Scroll {scroll_num + 1}: {new_count} videos")
                    no_new_count = 0
                else:
                    no_new_count += 1

                last_count = new_count

                if no_new_count >= 5:
                    print("  No more new videos found.")
                    break

                # Scroll down
                await page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)")
                await asyncio.sleep(1.5)

            print(f"\nTotal: {len(videos)} videos scraped")

            # Save
            output_path = TAKEOUT_DIR / "watch-history.json"
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(videos, f, ensure_ascii=False, indent=2)

            print(f"Saved to: {output_path}")

            # Keep browser open briefly so user can see result
            print("\nClosing browser in 5 seconds...")
            await asyncio.sleep(5)

            return videos

        finally:
            await browser.close()


async def main():
    max_scroll = 50
    for arg in sys.argv[1:]:
        if arg.startswith("--scrolls="):
            try:
                max_scroll = int(arg.split("=")[1])
            except:
                pass

    videos = await scrape_youtube_history(max_scroll=max_scroll)

    if videos:
        print(f"\n{'=' * 60}")
        print(f"SUCCESS! Scraped {len(videos)} videos")
        print(f"{'=' * 60}")
        print("\nTo index, run: curl -X POST http://localhost:8000/api/sync")


if __name__ == "__main__":
    asyncio.run(main())
