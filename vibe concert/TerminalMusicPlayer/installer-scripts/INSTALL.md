# Terminal Music Player - Installation Guide

Welcome! This app plays music automatically when you start Claude Code sessions.

## 📦 Quick Installation (Recommended)

### Option A: One-Click Installer

1. **Open the DMG** - Double-click the downloaded DMG file
2. **Run Installer** - Double-click **Install.command**
3. **Enter Password** - When prompted (for security removal)
4. **Done!** - App launches automatically

The installer will:
- ✅ Copy app to Applications folder
- ✅ Remove quarantine/security restrictions
- ✅ Install Claude Code hooks
- ✅ Launch the app

**No Homebrew needed!** Dependencies (yt-dlp & jq) are bundled inside the app.

---

## 📖 Manual Installation (Alternative)

If you prefer manual installation or the installer doesn't work:

### 1. Install the App

Drag **Terminal Music Player.app** to your **Applications** folder.

### 2. Remove Quarantine

Open Terminal and run:

```bash
sudo xattr -cr /Applications/TerminalMusicPlayer.app
```

This prevents the "app is damaged" error on macOS.

### 3. Install Claude Code Hooks

Open Terminal and run:

```bash
cd "/Volumes/Terminal Music Player Installer/Installation Scripts"
./Install\ Hooks
```

Or right-click **Install Hooks** → **Open** → Click **Open** in the dialog.

This will:
- Create hook scripts in `~/.claude/hooks/`
- Update your Claude Code settings
- Enable automatic session detection

### 4. Launch the App

Open **Terminal Music Player** from your Applications folder.

You should see a white circle in your menu bar ⚪

---

## 💡 About Dependencies

This app requires **yt-dlp** (YouTube audio extraction) and **jq** (JSON processing).

**Good news:** These are bundled inside the app! No installation needed.

If you prefer to use system-installed versions via Homebrew:
```bash
brew install yt-dlp jq
```

The app will automatically use bundled versions if system versions aren't found.

## 🎵 Quick Start

### Assign Music to a Project

Open Terminal and navigate to your project:

```bash
cd ~/your-project
~/.claude/hooks/assign-music.sh "https://www.youtube.com/watch?v=jfKfPfyJRdk"
```

### Start Coding

Start a Claude Code session in that directory:

```bash
claude
```

Music will start playing automatically! 🎉

## ⚙️ Manual Controls

Click the white circle in your menu bar to:
- Play/pause music
- Edit YouTube URL
- See active session info
- Toggle auto-play on/off

## 🐛 Troubleshooting

### Music doesn't play automatically

1. Make sure the app is running (check for white circle in menu bar)
2. Verify hooks are installed: `cat ~/.claude/settings.json | jq .hooks`
3. Check if music is assigned: `cat .claude/music.json`
4. View logs: `tail -f /tmp/musicplayer.log`

### Dependencies not found

Run the dependency checker or install manually:
```bash
brew install yt-dlp jq
```

### Permission errors

Make sure all scripts are executable:
```bash
chmod +x ~/.claude/hooks/music-*.sh
chmod +x ~/.claude/hooks/assign-music.sh
```

## 📖 More Information

For detailed documentation, see the README.md file included in this package.

## 🎵 Music Suggestions

Great YouTube channels for coding:
- **Lofi Girl**: https://www.youtube.com/watch?v=jfKfPfyJRdk
- **ChilledCow**: Relaxing lofi beats
- **Synthwave Radio**: Retro electronic vibes

---

**Enjoy coding with your personalized soundtrack!** 🎧

For questions or issues, check the logs at `/tmp/musicplayer.log`
