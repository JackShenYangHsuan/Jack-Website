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
