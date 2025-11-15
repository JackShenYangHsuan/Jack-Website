# Terminal Music Player - Quick Start

## Installation (4 Steps)

### 1. Install the App
Drag **Terminal Music Player.app** to **Applications** folder

### 2. Remove Quarantine
Open Terminal and run:
```bash
sudo xattr -cr /Applications/TerminalMusicPlayer.app
```

### 3. Install Dependencies
Open Terminal and run:
```bash
brew install yt-dlp jq
```

### 4. Install Hooks
Open Terminal and run:
```bash
cd "/Volumes/Terminal Music Player Installer/Installation Scripts"
./Install\ Hooks
```

**That's it!** Launch the app and you'll see a white circle in your menu bar.

---

## First Use

Assign music to your project:
```bash
cd ~/your-project
~/.claude/hooks/assign-music.sh "https://www.youtube.com/watch?v=jfKfPfyJRdk"
```

Start Claude Code:
```bash
claude
```

Music will play automatically! 🎵

---

**For detailed instructions, see Installation Guide.md**
