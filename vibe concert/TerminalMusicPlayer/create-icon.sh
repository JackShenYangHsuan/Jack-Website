#!/bin/bash

# Creates app icon from Claude Music Player.png
# Resizes the source PNG into all required macOS icon sizes

set -e

ICONSET_DIR="AppIcon.iconset"
OUTPUT_ICON="AppIcon.icns"
SOURCE_PNG="../../Claude Music Player.png"

echo "🎨 Creating app icon from Claude Music Player.png..."

# Check if source PNG exists
if [ ! -f "$SOURCE_PNG" ]; then
    echo "❌ Error: Source icon not found at $SOURCE_PNG"
    exit 1
fi

# Create iconset directory
rm -rf "$ICONSET_DIR"
mkdir "$ICONSET_DIR"

# Create all required icon sizes using macOS sips command
declare -a sizes=(
    "16:icon_16x16.png"
    "32:icon_16x16@2x.png"
    "32:icon_32x32.png"
    "64:icon_32x32@2x.png"
    "128:icon_128x128.png"
    "256:icon_128x128@2x.png"
    "256:icon_256x256.png"
    "512:icon_256x256@2x.png"
    "512:icon_512x512.png"
    "1024:icon_512x512@2x.png"
)

for entry in "${sizes[@]}"; do
    IFS=':' read -r size filename <<< "$entry"
    sips -z "$size" "$size" "$SOURCE_PNG" --out "$ICONSET_DIR/$filename" > /dev/null 2>&1
    echo "Created $filename (${size}x${size})"
done

echo "All icon sizes created!"

# Convert iconset to icns
echo "Converting to .icns format..."
iconutil -c icns "$ICONSET_DIR" -o "$OUTPUT_ICON"

# Clean up
rm -rf "$ICONSET_DIR"

echo "✅ Icon created: $OUTPUT_ICON"
echo "   (Generated from Claude Music Player.png)"
