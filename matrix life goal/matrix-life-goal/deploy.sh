#!/bin/bash

# Vision Quest - Deploy to jackshen.co/visionquest
# This script builds the app and copies it to the main website repo

echo "🚀 Building Vision Quest..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build successful!"

# Define paths
DIST_DIR="dist"
TARGET_DIR="../../visionquest"

echo "📦 Copying files to $TARGET_DIR..."

# Remove old files if they exist
if [ -d "$TARGET_DIR" ]; then
  echo "🗑️  Removing old files..."
  rm -rf "$TARGET_DIR"
fi

# Copy new files
echo "📋 Copying new build..."
cp -r "$DIST_DIR" "$TARGET_DIR"

if [ $? -eq 0 ]; then
  echo "✅ Files copied successfully!"
  echo ""
  echo "📍 Next steps:"
  echo "   1. cd ../  (go to main personal-website directory)"
  echo "   2. git add visionquest"
  echo "   3. git commit -m 'Deploy Vision Quest app'"
  echo "   4. git push"
  echo ""
  echo "🌐 App will be live at: https://jackshen.co/visionquest"
else
  echo "❌ Copy failed!"
  exit 1
fi
