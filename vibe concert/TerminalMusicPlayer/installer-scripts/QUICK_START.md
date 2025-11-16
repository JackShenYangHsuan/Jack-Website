# Terminal Music Player - Quick Start

## Installation (3 Steps!)

### 1. Open the DMG
Double-click the downloaded DMG file

### 2. Remove macOS Quarantine (REQUIRED)
**Right-click** (or Control+click) **Remove-Quarantine.command** → Select **"Open"** → Click **"Open"** in the dialog → Enter your password

⚠️ **Important:** You must right-click and select "Open" (not double-click) because macOS blocks unsigned apps. This one-time command fixes it.

### 3. Run the Installer
Double-click **Install.command** and follow the prompts

**That's it!** The installer will:
- ✅ Install the app to Applications
- ✅ Set up Claude Code hooks
- ✅ Launch the app automatically

The app includes bundled dependencies (yt-dlp & jq), so no Homebrew required!

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
