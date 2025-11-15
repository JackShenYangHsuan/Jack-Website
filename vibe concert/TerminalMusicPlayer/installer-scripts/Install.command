#!/bin/bash
# Terminal Music Player - One-Click Installer

set -e

echo "🎵 Terminal Music Player - Installation"
echo "========================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DMG_ROOT="$(dirname "$SCRIPT_DIR")"

APP_NAME="TerminalMusicPlayer.app"
APP_PATH="/Applications/$APP_NAME"
DMG_APP_PATH="$DMG_ROOT/$APP_NAME"

# Step 1: Copy app to Applications
echo "Step 1/4: Installing app to /Applications..."
if [ -d "$APP_PATH" ]; then
    echo "⚠️  App already exists. Removing old version..."
    rm -rf "$APP_PATH"
fi

cp -r "$DMG_APP_PATH" /Applications/
echo "✅ App installed"

# Step 2: Remove quarantine (requires sudo)
echo ""
echo "Step 2/4: Removing quarantine attribute..."
echo "(You'll be prompted for your password)"
sudo xattr -cr "$APP_PATH"
echo "✅ Quarantine removed"

# Step 3: Check dependencies
echo ""
echo "Step 3/4: Checking dependencies..."

# Check if we have bundled dependencies
BUNDLED_YTDLP="$APP_PATH/Contents/Resources/bin/yt-dlp"
BUNDLED_JQ="$APP_PATH/Contents/Resources/bin/jq"

if [ -f "$BUNDLED_YTDLP" ] && [ -f "$BUNDLED_JQ" ]; then
    echo "✅ Using bundled dependencies (yt-dlp and jq)"
else
    # Check for Homebrew installation
    if ! command -v brew &> /dev/null; then
        echo "⚠️  Homebrew not found"
        echo ""
        echo "yt-dlp and jq are required. You can either:"
        echo "  1. Install Homebrew from https://brew.sh, then run:"
        echo "     brew install yt-dlp jq"
        echo "  2. Install them manually from their websites"
        echo ""
        read -p "Press Enter to continue without installing dependencies..."
    else
        DEPS_TO_INSTALL=()

        if ! command -v yt-dlp &> /dev/null; then
            DEPS_TO_INSTALL+=("yt-dlp")
        fi

        if ! command -v jq &> /dev/null; then
            DEPS_TO_INSTALL+=("jq")
        fi

        if [ ${#DEPS_TO_INSTALL[@]} -gt 0 ]; then
            echo "Installing missing dependencies: ${DEPS_TO_INSTALL[@]}"
            brew install "${DEPS_TO_INSTALL[@]}"
            echo "✅ Dependencies installed"
        else
            echo "✅ All dependencies already installed"
        fi
    fi
fi

# Step 4: Install hooks
echo ""
echo "Step 4/4: Installing Claude Code hooks..."
if [ -f "$SCRIPT_DIR/install-hooks.sh" ]; then
    bash "$SCRIPT_DIR/install-hooks.sh"
elif [ -f "$SCRIPT_DIR/../Installation Scripts/Install Hooks" ]; then
    bash "$SCRIPT_DIR/../Installation Scripts/Install Hooks"
else
    echo "⚠️  Hook installer not found. Please run it manually."
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Terminal Music Player is now installed and ready to use."
echo "You should see a white circle in your menu bar when the app runs."
echo ""
read -p "Press Enter to launch the app now..."

open "$APP_PATH"
