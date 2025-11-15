#!/bin/bash

# Creates a simple black circle icon for Terminal Music Player
# This is a placeholder until a custom icon is provided

set -e

ICONSET_DIR="AppIcon.iconset"
OUTPUT_ICON="AppIcon.icns"

echo "🎨 Creating placeholder app icon..."

# Create iconset directory
rm -rf "$ICONSET_DIR"
mkdir "$ICONSET_DIR"

# Create a simple black circle PNG using Python
python3 << 'EOF'
from PIL import Image, ImageDraw

def create_icon(size, filename):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw black circle with slight margin
    margin = size // 10
    draw.ellipse([margin, margin, size - margin, size - margin],
                 fill=(0, 0, 0, 255))

    img.save(filename, 'PNG')

# Create all required icon sizes
sizes = [
    (16, "icon_16x16.png"),
    (32, "icon_16x16@2x.png"),
    (32, "icon_32x32.png"),
    (64, "icon_32x32@2x.png"),
    (128, "icon_128x128.png"),
    (256, "icon_128x128@2x.png"),
    (256, "icon_256x256.png"),
    (512, "icon_256x256@2x.png"),
    (512, "icon_512x512.png"),
    (1024, "icon_512x512@2x.png"),
]

iconset_dir = "AppIcon.iconset"
for size, filename in sizes:
    create_icon(size, f"{iconset_dir}/{filename}")
    print(f"Created {filename} ({size}x{size})")

print("All icon sizes created!")
EOF

# Convert iconset to icns
echo "Converting to .icns format..."
iconutil -c icns "$ICONSET_DIR" -o "$OUTPUT_ICON"

# Clean up
rm -rf "$ICONSET_DIR"

echo "✅ Icon created: $OUTPUT_ICON"
echo "   (This is a simple black circle placeholder)"
