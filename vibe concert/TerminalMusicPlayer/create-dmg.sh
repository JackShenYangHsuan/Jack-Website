#!/bin/bash

# Terminal Music Player - DMG Creation Script
# Creates a distributable .dmg installer

set -e

APP_NAME="Terminal Music Player"
BUNDLE_NAME="TerminalMusicPlayer.app"
DMG_NAME="TerminalMusicPlayer-1.0.0.dmg"
VOLUME_NAME="Terminal Music Player Installer"
DMG_DIR="dmg-contents"
BUILD_DIR="build"

echo "📀 Creating Terminal Music Player DMG installer..."
echo ""

# Step 1: Build the app
echo "Step 1/5: Building the app..."
./build-app.sh
echo ""

# Step 2: Create DMG contents directory
echo "Step 2/5: Preparing DMG contents..."
rm -rf "$DMG_DIR"
mkdir -p "$DMG_DIR"

# Copy the app bundle
cp -r "$BUILD_DIR/$BUNDLE_NAME" "$DMG_DIR/"

# Create Applications symlink for drag-and-drop
ln -s /Applications "$DMG_DIR/Applications"

# Copy one-click installer to top level
cp installer-scripts/Install.command "$DMG_DIR/"
chmod +x "$DMG_DIR/Install.command"

# Copy installation scripts
mkdir -p "$DMG_DIR/Installation Scripts"
cp installer-scripts/install-hooks.sh "$DMG_DIR/Installation Scripts/Install Hooks"
cp installer-scripts/check-dependencies.sh "$DMG_DIR/Installation Scripts/Check Dependencies"
chmod +x "$DMG_DIR/Installation Scripts/Install Hooks"
chmod +x "$DMG_DIR/Installation Scripts/Check Dependencies"

# Copy documentation
cp installer-scripts/QUICK_START.md "$DMG_DIR/START HERE.md"
cp installer-scripts/INSTALL.md "$DMG_DIR/Installation Guide.md"
cp README.md "$DMG_DIR/"

echo "✅ DMG contents prepared"
echo ""

# Step 3: Create the DMG
echo "Step 3/5: Creating DMG image..."
rm -f "$DMG_NAME"

# Create a temporary DMG
hdiutil create -volname "$VOLUME_NAME" \
    -srcfolder "$DMG_DIR" \
    -ov -format UDRW \
    -fs HFS+ \
    "$DMG_NAME.temp.dmg"

# Mount it
DEVICE=$(hdiutil attach -readwrite -noverify -noautoopen "$DMG_NAME.temp.dmg" | grep -E '^/dev/' | sed 1q | awk '{print $1}')

echo "✅ DMG mounted at $DEVICE"

# Wait a moment for the volume to mount
sleep 2

# Set DMG window properties
echo "Step 4/5: Configuring DMG appearance..."

# Use AppleScript to set window properties
osascript << EOF
tell application "Finder"
    tell disk "$VOLUME_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {100, 100, 700, 500}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 72
        delay 2
        try
            set position of item "Install.command" of container window to {300, 120}
        end try
        try
            set position of item "$BUNDLE_NAME" of container window to {150, 250}
        end try
        try
            set position of item "Applications" of container window to {450, 250}
        end try
        try
            set position of item "Installation Scripts" of container window to {300, 350}
        end try
        delay 2
        close
        open
        update without registering applications
        delay 1
    end tell
end tell
EOF

# Unmount
echo "Step 5/5: Finalizing DMG..."
sync
hdiutil detach "$DEVICE"

# Convert to compressed read-only DMG
hdiutil convert "$DMG_NAME.temp.dmg" \
    -format UDZO \
    -imagekey zlib-level=9 \
    -o "$DMG_NAME"

# Clean up
rm -f "$DMG_NAME.temp.dmg"
rm -rf "$DMG_DIR"

echo ""
echo "✅ DMG created successfully!"
echo "📦 File: $DMG_NAME"
echo ""
echo "File size:"
du -h "$DMG_NAME"
echo ""
echo "To test:"
echo "  open $DMG_NAME"
echo ""
echo "To distribute:"
echo "  Upload $DMG_NAME to your website or file sharing service"
