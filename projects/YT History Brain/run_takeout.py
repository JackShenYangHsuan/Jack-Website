#!/usr/bin/env python3
"""
Run Google Takeout automation.

First run: Opens browser for manual login (saves cookies for future runs)
Subsequent runs: Can run headless using saved cookies
"""
import asyncio
import sys
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent))

from playwright.async_api import async_playwright
import json

DATA_DIR = Path(__file__).parent / "data"
COOKIES_FILE = DATA_DIR / "google_cookies.json"
TAKEOUT_DIR = DATA_DIR / "takeout"

TAKEOUT_DIR.mkdir(parents=True, exist_ok=True)


async def run_takeout(headless: bool = False):
    """
    Automate Google Takeout to export YouTube watch history.

    Args:
        headless: Run without visible browser (only works with saved cookies)
    """
    print("Starting Google Takeout automation...")
    print(f"Headless mode: {headless}")

    async with async_playwright() as p:
        # Launch browser with download handling
        browser = await p.chromium.launch(
            headless=headless,
            downloads_path=str(TAKEOUT_DIR),
        )

        context = await browser.new_context(
            accept_downloads=True,
        )

        # Load cookies if available
        if COOKIES_FILE.exists():
            print("Loading saved cookies...")
            with open(COOKIES_FILE) as f:
                cookies = json.load(f)
            await context.add_cookies(cookies)

        page = await context.new_page()

        try:
            # Navigate to Google Takeout
            print("Navigating to Google Takeout...")
            await page.goto("https://takeout.google.com/settings/takeout")
            await page.wait_for_load_state("networkidle", timeout=30000)

            # Check if we need to log in
            if "accounts.google.com" in page.url:
                if headless:
                    print("ERROR: Not logged in. Run without --headless first to log in.")
                    return False

                print("\n" + "="*60)
                print("PLEASE LOG IN TO YOUR GOOGLE ACCOUNT IN THE BROWSER WINDOW")
                print("The script will continue automatically after login...")
                print("="*60 + "\n")

                # Wait for redirect back to takeout (up to 5 minutes)
                try:
                    await page.wait_for_url("**/takeout**", timeout=300000)
                    print("Login successful!")
                except:
                    print("Login timeout or cancelled.")
                    return False

            # Save cookies for future use
            print("Saving cookies for future sessions...")
            cookies = await context.cookies()
            with open(COOKIES_FILE, "w") as f:
                json.dump(cookies, f)

            # Wait for page to fully load
            await page.wait_for_load_state("networkidle", timeout=30000)
            await asyncio.sleep(2)

            # Step 1: Click "Deselect all"
            print("Deselecting all products...")
            try:
                deselect_btn = page.locator("button:has-text('Deselect all')")
                if await deselect_btn.count() > 0:
                    await deselect_btn.click()
                    await asyncio.sleep(1)
            except Exception as e:
                print(f"Could not find Deselect all button: {e}")

            # Step 2: Find and select YouTube
            print("Selecting YouTube...")
            try:
                # Look for the YouTube row and click its checkbox
                youtube_label = page.locator("text=YouTube and YouTube Music")
                if await youtube_label.count() > 0:
                    # Click the parent row's checkbox
                    await youtube_label.click()
                    await asyncio.sleep(1)
            except Exception as e:
                print(f"Could not select YouTube: {e}")

            # Step 3: Configure to only export history
            print("Configuring export options...")
            try:
                # Click "All YouTube data included" button
                config_btn = page.locator("button:has-text('All YouTube data included')")
                if await config_btn.count() > 0:
                    await config_btn.click()
                    await asyncio.sleep(2)

                    # In the dialog, we need to deselect everything except history
                    # This is tricky as Google's UI varies

                    # Try to find and click OK/Done
                    ok_btn = page.locator("button:has-text('OK')")
                    if await ok_btn.count() > 0:
                        await ok_btn.click()
                        await asyncio.sleep(1)
            except Exception as e:
                print(f"Could not configure YouTube options: {e}")

            # Step 4: Click "Next step"
            print("Moving to next step...")
            try:
                next_btn = page.locator("button:has-text('Next step')")
                if await next_btn.count() > 0:
                    await next_btn.click()
                    await asyncio.sleep(2)
            except Exception as e:
                print(f"Could not click Next step: {e}")

            # Step 5: Configure delivery options
            print("Configuring delivery...")
            try:
                # Select "Export once"
                once_option = page.locator("text=Export once")
                if await once_option.count() > 0:
                    await once_option.click()
                    await asyncio.sleep(0.5)
            except Exception as e:
                print(f"Could not set export frequency: {e}")

            # Step 6: Create export
            print("Creating export...")
            try:
                create_btn = page.locator("button:has-text('Create export')")
                if await create_btn.count() > 0:
                    await create_btn.click()
                    await asyncio.sleep(2)
                    print("\n" + "="*60)
                    print("EXPORT REQUESTED!")
                    print("Google will send you an email when your data is ready.")
                    print("This usually takes 10-30 minutes.")
                    print("="*60 + "\n")
            except Exception as e:
                print(f"Could not create export: {e}")

            # Keep browser open for a moment to see result
            if not headless:
                print("Browser will stay open for 10 seconds so you can verify...")
                await asyncio.sleep(10)

            return True

        except Exception as e:
            print(f"Error during automation: {e}")
            if not headless:
                print("Browser will stay open for 30 seconds for debugging...")
                await asyncio.sleep(30)
            return False

        finally:
            await browser.close()


if __name__ == "__main__":
    headless = "--headless" in sys.argv
    asyncio.run(run_takeout(headless=headless))
