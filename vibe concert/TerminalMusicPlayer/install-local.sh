#!/bin/bash
# Vibe Concert - Local Test Installer
# This version works from the local directory for testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_NAME="Vibe Concert"
BUNDLE_NAME="TerminalMusicPlayer.app"
INSTALL_DIR="/Applications"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                        ║${NC}"
echo -e "${BLUE}║        🎵  VIBE CONCERT  🎵           ║${NC}"
echo -e "${BLUE}║    Music That Codes With You          ║${NC}"
echo -e "${BLUE}║                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Installing Vibe Concert (Local Build)...${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Check if running on macOS
echo -e "${BLUE}[1/5]${NC} Checking system compatibility..."
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ Error: This app requires macOS${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Running on macOS"

# Step 2: Check for Xcode Command Line Tools
echo ""
echo -e "${BLUE}[2/5]${NC} Checking for Xcode Command Line Tools..."
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
echo -e "${BLUE}[3/5]${NC} Checking for Swift compiler..."
if ! command -v swift &> /dev/null; then
    echo -e "${RED}❌ Error: Swift compiler not found${NC}"
    echo "Please install Xcode Command Line Tools:"
    echo "  xcode-select --install"
    exit 1
fi
SWIFT_VERSION=$(swift --version | head -n1)
echo -e "${GREEN}✓${NC} Swift compiler found: $SWIFT_VERSION"

# Step 4: Build the app
echo ""
echo -e "${BLUE}[4/5]${NC} Building Vibe Concert from source..."
echo "This may take a minute..."
echo ""

if [[ ! -f "build-app.sh" ]]; then
    echo -e "${RED}❌ Error: build-app.sh not found${NC}"
    echo "Please run this script from the TerminalMusicPlayer directory"
    exit 1
fi

if ./build-app.sh; then
    echo ""
    echo -e "${GREEN}✓${NC} Build complete!"
else
    echo -e "${RED}❌ Error: Build failed${NC}"
    exit 1
fi

# Step 5: Install to /Applications
echo ""
echo -e "${BLUE}[5/5]${NC} Installing to /Applications..."

if [[ -d "$INSTALL_DIR/$BUNDLE_NAME" ]]; then
    echo "Removing existing installation..."
    rm -rf "$INSTALL_DIR/$BUNDLE_NAME"
fi

echo "Copying app to /Applications..."
cp -r "build/$BUNDLE_NAME" "$INSTALL_DIR/"

echo -e "${GREEN}✓${NC} App installed (no quarantine - you built it locally!)"

# Install hooks
echo ""
echo "Setting up Claude Code integration..."
if [[ -f "installer-scripts/install-hooks.sh" ]]; then
    bash installer-scripts/install-hooks.sh
    echo -e "${GREEN}✓${NC} Claude Code hooks installed"
fi

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
