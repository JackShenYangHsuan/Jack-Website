# Terminal Music Player

A macOS menu bar app that automatically plays music when you start Claude Code sessions, with per-project music assignments.

## ✨ Features

### Core Functionality
- **Menu bar integration** - White circle icon in your menu bar
- **YouTube playback** - Uses yt-dlp + AVFoundation for high-quality audio
- **Background playback** - Music continues playing while you work
- **Manual controls** - Play/pause and edit URL directly from the menu

### 🎯 Claude Code Integration
- **Automatic session detection** - Monitors Claude Code sessions via hooks
- **Per-project music** - Assign different music to different projects
- **Auto play/pause** - Music starts when session starts, pauses when it stops
- **Session display** - See which project is currently active
- **Toggle control** - Enable/disable auto-play with a switch

## 🚀 Quick Start

### 1. Build the App
```bash
cd TerminalMusicPlayer
swift build
```

### 2. Run the App
```bash
.build/debug/TerminalMusicPlayer &
```

Or run in background persistently:
```bash
nohup .build/debug/TerminalMusicPlayer > /dev/null 2>&1 &
```

### 3. Assign Music to Your Project
```bash
~/.claude/hooks/assign-music.sh "https://www.youtube.com/watch?v=jfKfPfyJRdk"
```

This creates a `.claude/music.json` file in your current directory with the music assignment.

### 4. Start a Claude Code Session
The music will automatically start playing when you begin a Claude Code session in this directory!

## 📖 Usage Guide

### Assigning Music to Projects

Each project can have its own music assignment:

```bash
# Navigate to your project
cd ~/my-project

# Assign music (any YouTube URL)
~/.claude/hooks/assign-music.sh "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
```

This creates `.claude/music.json` in your project:
```json
{
  "youtubeURL": "https://www.youtube.com/watch?v=...",
  "assignedAt": "2025-11-12T23:00:00Z",
  "projectPath": "/Users/you/my-project"
}
```

### Manual Playback

You can also use the app manually:
1. Click the white circle in your menu bar
2. Click "Edit" to paste a YouTube URL
3. Click the play button

### Auto-Play Control

In the dropdown panel:
- **Green badge** shows when a Claude session is active
- **Auto toggle** enables/disables automatic playback
- Turn off auto-play if you want manual control only

## 🛠 How It Works

### Architecture

```
Claude Code Session Start
    ↓
SessionStart Hook (~/.claude/hooks/music-session-start.sh)
    ↓
Writes session info to /tmp/claude_music_session.json
    ↓
TerminalMusicPlayer monitors file (polls every 1 second)
    ↓
Detects new session → Loads project's music URL → Plays automatically
```

### Components

1. **Claude Code Hooks** (`~/.claude/settings.json`)
   - `SessionStart`: Triggers when Claude Code starts
   - `Stop`: Triggers when session ends

2. **Hook Scripts** (`~/.claude/hooks/`)
   - `music-session-start.sh`: Writes session data
   - `music-session-stop.sh`: Updates status to stopped
   - `assign-music.sh`: Helper to assign music

3. **TerminalMusicPlayer** (Swift app)
   - `SessionMonitor`: Watches for Claude Code sessions
   - `YouTubePlayer`: Handles audio playback via yt-dlp
   - `ContentView`: Menu bar UI with session info

### Data Flow

**Session Detection:**
```json
/tmp/claude_music_session.json
{
  "sessionId": "unique-uuid",
  "status": "active",
  "timestamp": 1699999999,
  "workingDirectory": "/path/to/project",
  "projectName": "my-project",
  "musicURL": "https://youtube.com/..."
}
```

**Project Assignment:**
```json
.claude/music.json (in your project directory)
{
  "youtubeURL": "https://youtube.com/...",
  "assignedAt": "2025-11-12T23:00:00Z",
  "projectPath": "/path/to/project"
}
```

## 🔧 Technical Details

- **Platform:** macOS 13.0+
- **Language:** Swift 5.9
- **Frameworks:** Cocoa, SwiftUI, AVFoundation
- **Dependencies:** yt-dlp, jq
- **Audio:** Extracted via yt-dlp, played with AVPlayer
- **Session Detection:** File-based IPC (polls /tmp)
- **No Dock Icon:** Runs as menu bar only

### Prerequisites

- **yt-dlp**: For YouTube audio extraction
  ```bash
  brew install yt-dlp
  ```

- **jq**: For JSON parsing in hooks
  ```bash
  brew install jq  # (already installed on your system)
  ```

## 📝 Logs & Debugging

The app writes logs to:
- **Music player:** `/tmp/musicplayer.log`
- **Hook execution:** `/tmp/claude_music_hook.log`
- **Session data:** `/tmp/claude_music_session.json`

View logs:
```bash
tail -f /tmp/musicplayer.log
tail -f /tmp/claude_music_hook.log
cat /tmp/claude_music_session.json | jq .
```

## 🎵 Music Suggestions

Great YouTube channels for coding:
- **Lofi Girl**: https://www.youtube.com/watch?v=jfKfPfyJRdk
- **ChilledCow**: Relaxing lofi beats
- **Synthwave Radio**: Retro electronic music
- **Coffee Shop Ambience**: Background cafe sounds

## 🔮 Future Enhancements

- [ ] GUI for managing project assignments
- [ ] Spotify integration
- [ ] Mood-based music (detected from code activity)
- [ ] Playlist support
- [ ] Visualization in menu bar
- [ ] Integration with other terminal tools

## 🤝 Integration with AgentWatch

This app works alongside AgentWatch! Both use Claude Code hooks:
- **AgentWatch**: Monitors session status and usage
- **TerminalMusicPlayer**: Triggers music based on sessions

They complement each other perfectly via the hook system.

## 📄 License

Personal project for demonstration purposes.
