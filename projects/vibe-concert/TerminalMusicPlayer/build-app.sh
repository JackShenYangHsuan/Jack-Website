#!/bin/bash

# Terminal Music Player - Build Script
# Compiles the Swift package and creates a proper macOS .app bundle

set -e  # Exit on error

APP_NAME="Terminal Music Player"
BUNDLE_NAME="TerminalMusicPlayer.app"
EXECUTABLE_NAME="TerminalMusicPlayer"
BUILD_DIR=".build/release"
APP_DIR="build/$BUNDLE_NAME"

echo "🔨 Building Terminal Music Player..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf build
mkdir -p build

# Build the Swift package in release mode
echo "Compiling Swift package (release mode)..."
swift build -c release

# Create .app bundle structure
echo "Creating .app bundle structure..."
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Copy executable
echo "Copying executable..."
cp "$BUILD_DIR/$EXECUTABLE_NAME" "$APP_DIR/Contents/MacOS/"
chmod +x "$APP_DIR/Contents/MacOS/$EXECUTABLE_NAME"

# Copy Info.plist
echo "Copying Info.plist..."
cp Info.plist "$APP_DIR/Contents/"

# Copy icon if it exists
if [ -f "AppIcon.icns" ]; then
    echo "Copying app icon..."
    cp AppIcon.icns "$APP_DIR/Contents/Resources/"
fi

# Bundle dependencies (yt-dlp and jq)
echo "Bundling dependencies..."
mkdir -p "$APP_DIR/Contents/Resources/bin"

# Download yt-dlp
echo "  Downloading yt-dlp..."
curl -L -s https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos \
    -o "$APP_DIR/Contents/Resources/bin/yt-dlp"
chmod +x "$APP_DIR/Contents/Resources/bin/yt-dlp"

# Download jq (detect architecture)
echo "  Downloading jq..."
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    JQ_BINARY="jq-macos-arm64"
else
    JQ_BINARY="jq-macos-amd64"
fi

curl -L -s "https://github.com/jqlang/jq/releases/latest/download/$JQ_BINARY" \
    -o "$APP_DIR/Contents/Resources/bin/jq"
chmod +x "$APP_DIR/Contents/Resources/bin/jq"

echo "✅ Dependencies bundled"

# Set bundle permissions
echo "Setting permissions..."
chmod -R 755 "$APP_DIR"

echo "✅ Build complete!"
echo "📦 App bundle created at: $APP_DIR"
echo ""
echo "To test the app:"
echo "  open \"$APP_DIR\""
echo ""
echo "To install to Applications:"
echo "  cp -r \"$APP_DIR\" /Applications/"
