#!/bin/bash

# Terminal Music Player - Remove macOS Quarantine
# This script removes macOS security restrictions (quarantine) from the installer.
#
# WHY IS THIS NEEDED?
# macOS applies "quarantine" to files downloaded from the internet.
# Since this app is not signed with an Apple Developer ID, macOS shows
# a "damaged" error. This one-time script removes the quarantine attribute.

clear

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Terminal Music Player - Remove macOS Quarantine     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "This will remove macOS security restrictions from the installer."
echo ""
echo "⚠️  You'll be prompted for your password (this is normal)."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Get the directory containing this script (the DMG mount point)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Removing quarantine attribute..."
echo "(Requires administrator password)"
echo ""

# Remove quarantine from everything in the DMG
if sudo xattr -cr "$SCRIPT_DIR"; then
    echo ""
    echo "✅ Success! Quarantine removed."
    echo ""
    echo "You can now run Install.command to install the app."
else
    echo ""
    echo "❌ Failed to remove quarantine."
    echo ""
    echo "You can try manually:"
    echo "  1. Open Terminal"
    echo "  2. Run: sudo xattr -cr \"$SCRIPT_DIR\""
    echo "  3. Enter your password"
fi

echo ""
read -p "Press Enter to close..."
