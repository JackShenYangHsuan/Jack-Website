"""
Google Takeout automation using Playwright.

Note: This is a fragile automation that may break if Google changes their UI.
Always have a manual fallback option.
"""
import asyncio
import zipfile
from pathlib import Path
from typing import Optional

import config


class TakeoutScraper:
    """
    Automate Google Takeout export for YouTube watch history.

    Usage:
        scraper = TakeoutScraper()
        await scraper.run()

    First run requires manual login to save cookies.
    """

    def __init__(
        self,
        download_dir: Optional[Path] = None,
        cookies_file: Optional[Path] = None,
    ):
        self.download_dir = download_dir or config.TAKEOUT_DIR
        self.cookies_file = cookies_file or (config.DATA_DIR / "cookies.json")
        self.download_dir.mkdir(parents=True, exist_ok=True)

    async def run(self, headless: bool = False) -> Optional[Path]:
        """
        Run the Google Takeout automation.

        Args:
            headless: Run browser in headless mode (requires saved cookies)

        Returns:
            Path to the extracted watch-history.json or None if failed
        """
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=headless)
            context = await browser.new_context()

            # Load cookies if available
            if self.cookies_file.exists():
                import json
                with open(self.cookies_file) as f:
                    cookies = json.load(f)
                await context.add_cookies(cookies)

            page = await context.new_page()

            try:
                # Navigate to Google Takeout
                await page.goto("https://takeout.google.com/settings/takeout")
                await page.wait_for_load_state("networkidle")

                # Check if logged in
                if "accounts.google.com" in page.url:
                    if headless:
                        print("Not logged in. Run with headless=False first to login.")
                        return None

                    print("Please log in manually...")
                    # Wait for user to complete login (max 5 minutes)
                    await page.wait_for_url("**/takeout**", timeout=300000)

                # Save cookies after login
                cookies = await context.cookies()
                import json
                with open(self.cookies_file, "w") as f:
                    json.dump(cookies, f)

                # Click "Deselect all"
                deselect_btn = page.locator("text=Deselect all")
                if await deselect_btn.count() > 0:
                    await deselect_btn.click()
                    await page.wait_for_timeout(1000)

                # Find and select YouTube
                youtube_row = page.locator("text=YouTube and YouTube Music")
                if await youtube_row.count() > 0:
                    # Click the checkbox near YouTube
                    checkbox = youtube_row.locator("xpath=ancestor::*[contains(@class, 'product')]//input[@type='checkbox']")
                    if await checkbox.count() > 0:
                        await checkbox.click()
                        await page.wait_for_timeout(500)

                # Click "All YouTube data included" to configure
                config_btn = page.locator("text=All YouTube data included")
                if await config_btn.count() > 0:
                    await config_btn.click()
                    await page.wait_for_timeout(1000)

                    # Deselect everything except history
                    # This part is tricky as Google's UI changes frequently
                    # You may need to adjust selectors

                    # Click done/save
                    done_btn = page.locator("text=OK")
                    if await done_btn.count() > 0:
                        await done_btn.click()
                        await page.wait_for_timeout(500)

                # Click "Next step"
                next_btn = page.locator("text=Next step")
                if await next_btn.count() > 0:
                    await next_btn.click()
                    await page.wait_for_timeout(2000)

                # Configure export options
                # Select "Export once"
                once_radio = page.locator("text=Export once")
                if await once_radio.count() > 0:
                    await once_radio.click()

                # Select .zip format
                zip_radio = page.locator("text=.zip")
                if await zip_radio.count() > 0:
                    await zip_radio.click()

                # Create export
                create_btn = page.locator("text=Create export")
                if await create_btn.count() > 0:
                    await create_btn.click()
                    print("Export requested. Check your email for download link.")

                # Note: Google sends an email when export is ready
                # Full automation would need to monitor email or poll
                # For now, we return None and user can download manually

                return None

            except Exception as e:
                print(f"Takeout automation error: {e}")
                return None
            finally:
                await browser.close()

    def extract_history(self, zip_path: Path) -> Optional[Path]:
        """
        Extract watch-history.json from a Takeout zip file.

        Args:
            zip_path: Path to the downloaded Takeout zip

        Returns:
            Path to the extracted watch-history.json
        """
        output_path = self.download_dir / "watch-history.json"

        try:
            with zipfile.ZipFile(zip_path, "r") as zf:
                # Look for watch history file
                for name in zf.namelist():
                    if "watch-history.json" in name.lower():
                        # Extract to our directory
                        data = zf.read(name)
                        output_path.write_bytes(data)
                        print(f"Extracted watch history to {output_path}")
                        return output_path

            print("watch-history.json not found in zip file")
            return None

        except Exception as e:
            print(f"Error extracting zip: {e}")
            return None


async def manual_download_instructions():
    """Print instructions for manual Google Takeout download."""
    instructions = """
    === Manual Google Takeout Download ===

    1. Go to https://takeout.google.com

    2. Click "Deselect all"

    3. Scroll down and select "YouTube and YouTube Music"

    4. Click "All YouTube data included"
       - Deselect everything except "history"
       - Click OK

    5. Click "Next step"

    6. Choose:
       - Delivery method: "Send download link via email"
       - Frequency: "Export once"
       - File type: ".zip"
       - File size: "2 GB" (or any)

    7. Click "Create export"

    8. Wait for email from Google (usually 10-30 minutes)

    9. Download the zip file

    10. Extract and find:
        Takeout/YouTube and YouTube Music/history/watch-history.json

    11. Upload this file to YT History Brain
    """
    print(instructions)


if __name__ == "__main__":
    asyncio.run(manual_download_instructions())
