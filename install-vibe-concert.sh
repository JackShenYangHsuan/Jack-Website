#!/bin/bash
# Vibe Concert - One-Line Installer
# Builds and installs Vibe Concert from source
#
# Usage:
#   curl -fsSL https://jackshen.co/install-vibe-concert.sh | bash
#
# Or inspect first:
#   curl -fsSL https://jackshen.co/install-vibe-concert.sh -o install.sh && bash install.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Vibe Concert"
BUNDLE_NAME="TerminalMusicPlayer.app"
INSTALL_DIR="/Applications"
REPO_URL="https://github.com/jackshen/vibe-concert" # Update with actual repo
TEMP_DIR="/tmp/vibe-concert-install-$$"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                        ║${NC}"
echo -e "${BLUE}║        🎵  VIBE CONCERT  🎵           ║${NC}"
echo -e "${BLUE}║    Music That Codes With You          ║${NC}"
echo -e "${BLUE}║                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Installing Vibe Concert...${NC}"
echo ""

# Step 1: Check if running on macOS
echo -e "${BLUE}[1/7]${NC} Checking system compatibility..."
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ Error: This app requires macOS${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Running on macOS"

# Step 2: Check for Xcode Command Line Tools
echo ""
echo -e "${BLUE}[2/7]${NC} Checking for Xcode Command Line Tools..."
if ! xcode-select -p &> /dev/null; then
    echo -e "${YELLOW}⚠️  Xcode Command Line Tools not found${NC}"
    echo ""
    echo "Installing Xcode Command Line Tools..."
    echo "Please follow the prompts and run this script again after installation."
    xcode-select --install
    exit 1
fi
echo -e "${GREEN}✓${NC} Xcode Command Line Tools installed"

# Step 3: Check for Swift compiler
echo ""
echo -e "${BLUE}[3/7]${NC} Checking for Swift compiler..."
if ! command -v swift &> /dev/null; then
    echo -e "${RED}❌ Error: Swift compiler not found${NC}"
    echo "Please install Xcode Command Line Tools:"
    echo "  xcode-select --install"
    exit 1
fi
SWIFT_VERSION=$(swift --version | head -n1)
echo -e "${GREEN}✓${NC} Swift compiler found: $SWIFT_VERSION"

# Step 4: Download source code
echo ""
echo -e "${BLUE}[4/7]${NC} Downloading source code..."
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# For now, download a tarball from your website
# Later, this can be updated to clone from GitHub
SOURCE_URL="https://jackshen.co/vibe-concert/source.tar.gz"

if command -v curl &> /dev/null; then
    echo "Downloading from $SOURCE_URL..."
    if curl -fsSL "$SOURCE_URL" -o source.tar.gz 2>/dev/null; then
        tar -xzf source.tar.gz
        echo -e "${GREEN}✓${NC} Source code downloaded"
    else
        echo -e "${YELLOW}⚠️  Download from URL failed, checking for local installation...${NC}"
        # Fallback: if script is run from the repo directory
        if [[ -f "../build-app.sh" ]]; then
            cd ..
            echo -e "${GREEN}✓${NC} Using local source code"
        else
            echo -e "${RED}❌ Error: Could not download source code${NC}"
            echo "Please ensure you have internet connection or run from the source directory"
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ Error: curl not found${NC}"
    exit 1
fi

# Step 5: Build the app
echo ""
echo -e "${BLUE}[5/7]${NC} Building Vibe Concert from source..."
echo "This may take a minute..."
echo ""

# Check if build script exists
if [[ ! -f "build-app.sh" ]]; then
    echo -e "${RED}❌ Error: build-app.sh not found${NC}"
    exit 1
fi

# Run the build
if ./build-app.sh; then
    echo ""
    echo -e "${GREEN}✓${NC} Build complete!"
else
    echo -e "${RED}❌ Error: Build failed${NC}"
    exit 1
fi

# Step 6: Install to /Applications
echo ""
echo -e "${BLUE}[6/7]${NC} Installing to /Applications..."

if [[ -d "$INSTALL_DIR/$BUNDLE_NAME" ]]; then
    echo "Removing existing installation..."
    rm -rf "$INSTALL_DIR/$BUNDLE_NAME"
fi

echo "Copying app to /Applications..."
cp -r "build/$BUNDLE_NAME" "$INSTALL_DIR/"

# No need to remove quarantine since we built it locally!
echo -e "${GREEN}✓${NC} App installed (no quarantine - you built it locally!)"

# Step 7: Install Claude Code hooks
echo ""
echo -e "${BLUE}[7/7]${NC} Setting up Claude Code integration..."

if [[ -f "installer-scripts/install-hooks.sh" ]]; then
    bash installer-scripts/install-hooks.sh
    echo -e "${GREEN}✓${NC} Claude Code hooks installed"
else
    echo -e "${YELLOW}⚠️  Hook installer not found. You may need to set up hooks manually.${NC}"
fi

# Cleanup
echo ""
echo "Cleaning up temporary files..."
cd /
rm -rf "$TEMP_DIR"

# Success!
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}║     ✅  INSTALLATION COMPLETE!        ║${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Vibe Concert${NC} has been installed successfully!"
echo ""
echo "🎵 Quick Start:"
echo ""
echo "  1. Assign music to your project:"
echo -e "     ${YELLOW}cd ~/your-project${NC}"
echo -e "     ${YELLOW}~/.claude/hooks/assign-music.sh \"https://www.youtube.com/watch?v=jfKfPfyJRdk\"${NC}"
echo ""
echo "  2. Start Claude Code:"
echo -e "     ${YELLOW}claude${NC}"
echo ""
echo "  Music will play automatically! 🎧"
echo ""
echo -e "Look for the ${BLUE}⚪ white circle${NC} in your menu bar to control playback."
echo ""
echo "For help, visit: https://jackshen.co/vibe-concert"
echo ""

# Ask if they want to launch now
read -p "Launch Vibe Concert now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Launching Vibe Concert..."
    open "$INSTALL_DIR/$BUNDLE_NAME"
    echo -e "${GREEN}✓${NC} Vibe Concert is running!"
fi

echo ""
echo "Thanks for installing Vibe Concert! Happy coding! 🎵"
echo ""
