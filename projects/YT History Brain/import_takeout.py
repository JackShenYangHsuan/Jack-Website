#!/usr/bin/env python3
"""
Import Google Takeout data from Downloads folder.

Usage:
    python import_takeout.py                    # Process most recent takeout zip
    python import_takeout.py /path/to/file.zip  # Process specific file
    python import_takeout.py --watch            # Watch Downloads for new files
"""
import sys
import time
import zipfile
import shutil
from pathlib import Path
from datetime import datetime

# Project paths
PROJECT_DIR = Path(__file__).parent
DATA_DIR = PROJECT_DIR / "data"
TAKEOUT_DIR = DATA_DIR / "takeout"

# Common download locations
DOWNLOADS_DIRS = [
    Path.home() / "Downloads",
    Path.home() / "Desktop",
]


def find_takeout_zips(directories: list[Path] = None) -> list[Path]:
    """Find Google Takeout zip files in common locations."""
    directories = directories or DOWNLOADS_DIRS
    takeout_files = []

    for directory in directories:
        if directory.exists():
            # Look for takeout-*.zip files
            for pattern in ["takeout-*.zip", "Takeout*.zip", "*takeout*.zip"]:
                takeout_files.extend(directory.glob(pattern))

    # Sort by modification time (newest first)
    takeout_files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return takeout_files


def extract_watch_history(zip_path: Path) -> Path | None:
    """
    Extract watch-history.json from a Takeout zip file.

    Returns path to extracted file or None if not found.
    """
    print(f"Processing: {zip_path.name}")

    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            # Find watch-history.json in the archive
            history_files = [
                name for name in zf.namelist()
                if "watch-history.json" in name.lower()
            ]

            if not history_files:
                print("  No watch-history.json found in this archive")
                return None

            # Extract the first match
            source_path = history_files[0]
            print(f"  Found: {source_path}")

            # Read and save to our data directory
            TAKEOUT_DIR.mkdir(parents=True, exist_ok=True)
            output_path = TAKEOUT_DIR / "watch-history.json"

            data = zf.read(source_path)
            output_path.write_bytes(data)

            print(f"  Extracted to: {output_path}")

            # Count entries
            import json
            entries = json.loads(data)
            youtube_entries = [e for e in entries if e.get("header") == "YouTube"]
            print(f"  Found {len(youtube_entries)} YouTube watch entries")

            return output_path

    except zipfile.BadZipFile:
        print(f"  Error: Not a valid zip file")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None


def watch_for_takeout(interval: int = 5):
    """Watch Downloads folder for new Takeout files."""
    print("Watching for Google Takeout downloads...")
    print("Download your data from: https://takeout.google.com")
    print("Press Ctrl+C to stop watching\n")

    seen_files = set(find_takeout_zips())

    try:
        while True:
            current_files = set(find_takeout_zips())
            new_files = current_files - seen_files

            for zip_path in new_files:
                print(f"\nNew Takeout file detected: {zip_path.name}")
                result = extract_watch_history(zip_path)

                if result:
                    print("\nReady to sync! Run:")
                    print("  curl -X POST http://localhost:8000/api/sync")
                    print("Or click 'Sync & Index' in the web UI")

            seen_files = current_files
            time.sleep(interval)

    except KeyboardInterrupt:
        print("\nStopped watching.")


def main():
    if len(sys.argv) > 1:
        arg = sys.argv[1]

        if arg == "--watch":
            watch_for_takeout()
            return

        # Specific file provided
        zip_path = Path(arg)
        if zip_path.exists():
            extract_watch_history(zip_path)
        else:
            print(f"File not found: {zip_path}")
            sys.exit(1)
    else:
        # Find most recent takeout
        takeout_files = find_takeout_zips()

        if not takeout_files:
            print("No Google Takeout files found in Downloads or Desktop.")
            print("\nTo export your YouTube history:")
            print("1. Go to https://takeout.google.com")
            print("2. Click 'Deselect all'")
            print("3. Select 'YouTube and YouTube Music'")
            print("4. Click 'All YouTube data included' -> select only 'history'")
            print("5. Click 'Next step' -> 'Create export'")
            print("6. Wait for email, download the zip")
            print("7. Run this script again")
            print("\nOr run: python import_takeout.py --watch")
            return

        print(f"Found {len(takeout_files)} Takeout file(s):\n")
        for i, f in enumerate(takeout_files[:5]):
            mtime = datetime.fromtimestamp(f.stat().st_mtime)
            print(f"  {i+1}. {f.name} ({mtime.strftime('%Y-%m-%d %H:%M')})")

        print(f"\nProcessing most recent: {takeout_files[0].name}\n")
        result = extract_watch_history(takeout_files[0])

        if result:
            print("\nReady to sync! Run:")
            print("  curl -X POST http://localhost:8000/api/sync")
            print("Or open http://localhost:8000 and click 'Sync & Index'")


if __name__ == "__main__":
    main()
