#!/bin/bash

# Terminal Music Player - Dependency Checker
# Checks for required dependencies and provides installation instructions

echo "🔍 Checking dependencies..."
echo ""

ALL_OK=true

# Check for yt-dlp
if command -v yt-dlp &> /dev/null; then
    YT_DLP_VERSION=$(yt-dlp --version)
    echo "✅ yt-dlp: $YT_DLP_VERSION"
else
    echo "❌ yt-dlp: Not found"
    echo "   Install with: brew install yt-dlp"
    ALL_OK=false
fi

# Check for jq
if command -v jq &> /dev/null; then
    JQ_VERSION=$(jq --version)
    echo "✅ jq: $JQ_VERSION"
else
    echo "❌ jq: Not found"
    echo "   Install with: brew install jq"
    ALL_OK=false
fi

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo ""
    echo "⚠️  Homebrew not found. Install from: https://brew.sh"
    echo "   Then run: brew install yt-dlp jq"
    ALL_OK=false
fi

echo ""

if [ "$ALL_OK" = true ]; then
    echo "🎉 All dependencies are installed!"
    exit 0
else
    echo "❌ Missing dependencies. Please install them and try again."
    echo ""
    echo "Quick install:"
    echo "  brew install yt-dlp jq"
    exit 1
fi
