# Terminal Music Player - Setup Guide

This guide will help you set up automatic music playback for Claude Code sessions.

## ✅ What's Already Done

The following has been configured on your system:

### 1. Hook Scripts Created
- `~/.claude/hooks/music-session-start.sh` - Triggers when Claude starts
- `~/.claude/hooks/music-session-stop.sh` - Triggers when Claude stops
- `~/.claude/hooks/assign-music.sh` - Helper to assign music to projects

### 2. Claude Settings Updated
Your `~/.claude/settings.json` now includes:
- `SessionStart` hook → triggers music session
- `Stop` hook → pauses music

These work alongside your existing AgentWatch hooks!

### 3. App Built
The TerminalMusicPlayer app has been compiled and is ready to run.

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Music Player

```bash
cd "/Users/jackshen/Desktop/personal-website/vibe concert/TerminalMusicPlayer"
.build/debug/TerminalMusicPlayer &
```

You should see a white circle appear in your menu bar.

### Step 2: Assign Music to This Project

```bash
~/.claude/hooks/assign-music.sh "https://www.youtube.com/watch?v=jfKfPfyJRdk"
```

This creates `.claude/music.json` in your current directory.

### Step 3: Test It!

**Option A: End this session and start a new one**
```bash
# Exit Claude Code, then start a new session
claude
```

**Option B: Manually trigger the hook**
```bash
~/.claude/hooks/music-session-start.sh
```

The music should start playing automatically!

## 🎵 Assigning Music to Different Projects

You can assign different music to each project you work on:

```bash
# For your personal website
cd ~/Desktop/personal-website
~/.claude/hooks/assign-music.sh "https://www.youtube.com/watch?v=lofi-music-id"

# For your command center
cd ~/Desktop/personal-website/command-center
~/.claude/hooks/assign-music.sh "https://www.youtube.com/watch?v=focus-music-id"

# For experimental projects
cd ~/experiments
~/.claude/hooks/assign-music.sh "https://www.youtube.com/watch?v=upbeat-music-id"
```

## 🔍 Verifying the Setup

### Check Hook Scripts
```bash
ls -l ~/.claude/hooks/music-*.sh
# All should be executable (rwxr-xr-x)
```

### Check Claude Settings
```bash
cat ~/.claude/settings.json | jq '.hooks.SessionStart'
# Should show the music-session-start.sh command
```

### Check Project Assignment
```bash
cat .claude/music.json | jq .
# Should show your YouTube URL
```

### Check Session Data
```bash
# After starting a Claude session, check:
cat /tmp/claude_music_session.json | jq .
# Should show active session with your project info
```

### Check Logs
```bash
# Music player logs
tail -20 /tmp/musicplayer.log

# Hook execution logs
tail -20 /tmp/claude_music_hook.log
```

## 🐛 Troubleshooting

### Music doesn't auto-play

1. **Check if the app is running:**
   ```bash
   ps aux | grep TerminalMusicPlayer
   ```

2. **Check if the session file was created:**
   ```bash
   cat /tmp/claude_music_session.json
   ```

3. **Check if music is assigned:**
   ```bash
   cat .claude/music.json
   ```

4. **Check the logs:**
   ```bash
   tail -50 /tmp/musicplayer.log
   tail -50 /tmp/claude_music_hook.log
   ```

### Hook not triggering

1. **Verify hook is in settings:**
   ```bash
   cat ~/.claude/settings.json | jq '.hooks.SessionStart'
   ```

2. **Test the hook manually:**
   ```bash
   ~/.claude/hooks/music-session-start.sh
   cat /tmp/claude_music_session.json
   ```

### Music plays but no sound

1. **Check system volume**
2. **Check if yt-dlp is working:**
   ```bash
   yt-dlp -f bestaudio --get-url "https://www.youtube.com/watch?v=jfKfPfyJRdk"
   ```

3. **Check player logs for errors:**
   ```bash
   tail -50 /tmp/musicplayer.log | grep -i error
   ```

## 🎮 Usage Tips

### Keep the app running
Add to your startup items or use LaunchAgent:
```bash
# Keep it running in background
nohup .build/debug/TerminalMusicPlayer > /dev/null 2>&1 &
```

### Disable auto-play temporarily
Click the white circle → Toggle "Auto" switch off

### Change music mid-session
Click the white circle → Edit → Paste new URL → Play

### See which project is active
Click the white circle → Look for green badge with project name

## 🎯 Example Workflow

```bash
# Morning: Personal website work
cd ~/Desktop/personal-website
~/.claude/hooks/assign-music.sh "https://www.youtube.com/watch?v=morning-lofi"
claude  # Music starts automatically!

# Afternoon: Command center development
cd ~/Desktop/personal-website/command-center
~/.claude/hooks/assign-music.sh "https://www.youtube.com/watch?v=focus-beats"
claude  # Different music for different projects!

# Evening: Experimental hacking
cd ~/experiments
~/.claude/hooks/assign-music.sh "https://www.youtube.com/watch?v=synthwave"
claude  # Energetic music for creative work!
```

## 📊 Integration with AgentWatch

Both apps work together seamlessly:
- **AgentWatch** shows session status, tool usage, and timing
- **TerminalMusicPlayer** provides the soundtrack

They both use Claude Code hooks and don't interfere with each other!

## 🔮 Next Steps

Once you're comfortable with the basics:
1. Assign music to all your projects
2. Explore different music genres for different types of work
3. Check out the logs to see how the system works
4. Consider creating playlists for longer sessions

Enjoy coding with your personalized soundtrack! 🎵
