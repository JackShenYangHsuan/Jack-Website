#!/bin/bash

# Terminal Music Player - Hook Installation Script
# Automatically sets up Claude Code hooks for music playback

set -e

HOOKS_DIR="$HOME/.claude/hooks"
SETTINGS_FILE="$HOME/.claude/settings.json"

echo "🎵 Terminal Music Player - Hook Setup"
echo "======================================"
echo ""

# Check if .claude directory exists
if [ ! -d "$HOME/.claude" ]; then
    echo "❌ Error: Claude Code not found at ~/.claude"
    echo "   Please install Claude Code first: https://code.claude.com"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

echo "📝 Installing hook scripts..."

# Create music-session-start.sh
cat > "$HOOKS_DIR/music-session-start.sh" << 'HOOK_START'
#!/bin/bash
# Claude Code Hook: SessionStart
# Notifies Terminal Music Player when a session starts

SESSION_FILE="/tmp/claude_music_session.json"
LOG_FILE="/tmp/claude_music_hook.log"

# Get current working directory and project name
WORKING_DIR="$PWD"
PROJECT_NAME=$(basename "$WORKING_DIR")

# Look for music assignment in .claude/music.json
MUSIC_URL=""
if [ -f ".claude/music.json" ]; then
    MUSIC_URL=$(jq -r '.youtubeURL // ""' .claude/music.json 2>/dev/null || echo "")
fi

# Generate session ID
SESSION_ID=$(uuidgen)

# Create session data
cat > "$SESSION_FILE" << EOF
{
  "sessionId": "$SESSION_ID",
  "status": "active",
  "timestamp": $(date +%s),
  "workingDirectory": "$WORKING_DIR",
  "projectName": "$PROJECT_NAME",
  "musicURL": "$MUSIC_URL"
}
EOF

echo "[$(date)] Session started: $PROJECT_NAME (URL: $MUSIC_URL)" >> "$LOG_FILE"
HOOK_START

# Create music-session-stop.sh
cat > "$HOOKS_DIR/music-session-stop.sh" << 'HOOK_STOP'
#!/bin/bash
# Claude Code Hook: Stop
# Notifies Terminal Music Player when a session stops

SESSION_FILE="/tmp/claude_music_session.json"
LOG_FILE="/tmp/claude_music_hook.log"

# Update session status to stopped
if [ -f "$SESSION_FILE" ]; then
    jq '.status = "stopped" | .timestamp = '$(date +%s) "$SESSION_FILE" > "$SESSION_FILE.tmp" && mv "$SESSION_FILE.tmp" "$SESSION_FILE"
fi

echo "[$(date)] Session stopped" >> "$LOG_FILE"
HOOK_STOP

# Create assign-music.sh
cat > "$HOOKS_DIR/assign-music.sh" << 'HOOK_ASSIGN'
#!/bin/bash
# Helper script to assign music to a project

if [ -z "$1" ]; then
    echo "Usage: assign-music.sh <youtube-url>"
    echo "Example: assign-music.sh 'https://www.youtube.com/watch?v=jfKfPfyJRdk'"
    exit 1
fi

YOUTUBE_URL="$1"
MUSIC_FILE=".claude/music.json"

# Create .claude directory if needed
mkdir -p .claude

# Create music assignment
cat > "$MUSIC_FILE" << EOF
{
  "youtubeURL": "$YOUTUBE_URL",
  "assignedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "projectPath": "$PWD"
}
EOF

echo "✅ Music assigned to $(basename "$PWD")"
echo "   URL: $YOUTUBE_URL"
echo "   Saved to: $MUSIC_FILE"
HOOK_ASSIGN

# Make all hooks executable
chmod +x "$HOOKS_DIR/music-session-start.sh"
chmod +x "$HOOKS_DIR/music-session-stop.sh"
chmod +x "$HOOKS_DIR/assign-music.sh"

echo "✅ Hook scripts installed to $HOOKS_DIR"
echo ""

# Update Claude settings
echo "⚙️  Updating Claude Code settings..."

if [ ! -f "$SETTINGS_FILE" ]; then
    # Create new settings file with hooks
    cat > "$SETTINGS_FILE" << 'SETTINGS'
{
  "hooks": {
    "SessionStart": "~/.claude/hooks/music-session-start.sh",
    "Stop": "~/.claude/hooks/music-session-stop.sh"
  }
}
SETTINGS
    echo "✅ Created new settings.json with hooks"
else
    # Check if jq is available for JSON manipulation
    if ! command -v jq &> /dev/null; then
        echo "⚠️  Warning: jq not found. Please manually add hooks to $SETTINGS_FILE"
        echo ""
        echo "Add these lines to your settings.json:"
        echo '  "hooks": {'
        echo '    "SessionStart": "~/.claude/hooks/music-session-start.sh",'
        echo '    "Stop": "~/.claude/hooks/music-session-stop.sh"'
        echo '  }'
    else
        # Use jq to merge hooks into existing settings
        TMP_FILE=$(mktemp)
        jq '.hooks.SessionStart = "~/.claude/hooks/music-session-start.sh" | .hooks.Stop = "~/.claude/hooks/music-session-stop.sh"' "$SETTINGS_FILE" > "$TMP_FILE"
        mv "$TMP_FILE" "$SETTINGS_FILE"
        echo "✅ Updated existing settings.json with hooks"
    fi
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Make sure Terminal Music Player is running (check menu bar for white circle)"
echo "2. Assign music to a project:"
echo "   cd ~/your-project"
echo "   ~/.claude/hooks/assign-music.sh 'https://www.youtube.com/watch?v=YOUR_VIDEO'"
echo "3. Start a Claude Code session in that directory"
echo ""
echo "For more info, see the README in the DMG or visit the documentation."
