# Product Requirements Document: Terminal Music Player Menu Bar App

## 1. Introduction/Overview

### Problem Statement
Developers working with Claude Code often have multiple terminal sessions running simultaneously. Long-running tasks can be boring and silent, and there's currently no elegant way to have ambient music playing during work that automatically stops when tasks complete to signal completion.

### Solution
A macOS menu bar application that monitors terminal sessions (leveraging AgentWatch's open-source monitoring capabilities) and automatically plays/pauses YouTube music based on terminal execution status. When a terminal is actively running a task, music plays to create a productive ambient environment; when it finishes, music stops to signal task completion. This creates a focus-enhancing system with built-in completion notifications.

### Goal
Build a lightweight macOS menu bar app that combines terminal session monitoring with YouTube music playback, providing developers with ambient focus music during execution and silent completion signals.

---

## 2. Goals

1. **Automatic Terminal Monitoring**: Detect and track all active terminal sessions without manual configuration
2. **Intelligent Music Playback**: Auto-play music when terminals are actively running, auto-stop when they finish
3. **Simple Music Assignment**: Allow users to easily assign YouTube links to specific terminal sessions
4. **Status Visibility**: Provide at-a-glance status indication of all terminal sessions in the menu bar
5. **Minimal User Interaction**: Require minimal setup and manual intervention once configured

---

## 3. User Stories

### Core User Stories

**As a developer**, I want to:
- See all my active terminal sessions in one place, so I can track what's running
- Assign different YouTube music links to different terminal sessions, so each project has its own "work music"
- Have music automatically play when my Claude Code task starts running, so I have ambient focus music during execution
- Have music automatically stop when the terminal finishes, so silence signals task completion
- Access all controls from the menu bar without opening a full application window

**As a music-focused developer**, I want to:
- Manually control playback (play/pause/skip) when needed, so I have override control
- See which track is currently playing, so I know what music is associated with which terminal
- Quickly update music links without complex configuration, so I can change my "work music" easily

---

## 4. Functional Requirements

### 4.1 Terminal Session Monitoring
1. The app **must** detect all active terminal sessions on the Mac
2. The app **must** monitor each terminal session's execution status (actively running vs. idle/finished)
3. The app **must** use a similar approach to AgentWatch for session detection (monitoring terminal processes and their state)
4. The app **must** display session status in real-time (update within 2 seconds of status change)
5. The app **must** distinguish between different terminal windows/tabs as separate sessions
6. The app **must** show session names/identifiers (e.g., terminal tab name, working directory, or process name)

### 4.2 Music Assignment & Management
7. The app **must** allow users to click the menu bar icon to open a dropdown panel
8. The panel **must** display a list of all detected terminal sessions
9. Users **must** be able to click on a terminal session entry to open a modal/input field
10. The modal **must** allow users to paste a YouTube URL and assign it to that terminal
11. The app **must** validate that the pasted URL is a valid YouTube link
12. The app **must** persist music assignments across app restarts (local storage/preferences)
13. The app **must** display assigned music info (video title or URL) next to each terminal in the list

### 4.3 Automatic Playback Control
14. The app **must** automatically start playing the assigned YouTube music when a terminal transitions from "idle/finished" to "actively running"
15. The app **must** automatically stop the music when a terminal transitions from "actively running" to "idle/finished"
16. When multiple terminals start running simultaneously, the app **must** play all associated music tracks at once (overlapping)
17. The app **must** continue monitoring and controlling playback until the user closes the terminal or removes the assignment

### 4.4 Manual Playback Controls
18. The panel **must** include manual play/pause/skip buttons for each terminal's assigned music
19. Users **must** be able to override automatic playback with manual controls
20. The skip button **must** stop the current track immediately
21. Manual controls **must** not interfere with the automatic playback triggers (auto-playback resumes when terminal status changes)

### 4.5 Menu Bar Integration
22. The app **must** run as a menu bar-only application (no dock icon)
23. The menu bar icon **must** display an overall status indicator showing:
    - **Green**: All terminals are actively running (music playing)
    - **Yellow**: Some terminals are running, some idle
    - **Red**: All terminals are idle/finished (all music stopped)
24. The icon **must** update in real-time to reflect the aggregate terminal status
25. Clicking the menu bar icon **must** open a dropdown panel displaying all terminal sessions

### 4.6 Panel UI
26. The panel **must** list all detected terminal sessions with the following info per entry:
    - Session name/identifier
    - Current status (Running/Idle)
    - Assigned music (if any)
    - Playback controls (play/pause/skip buttons)
27. The panel **must** use a design similar to the AgentWatch screenshot (clean, minimal, status-focused)
28. The panel **must** auto-update without requiring manual refresh
29. The panel **must** include an app settings/preferences button (gear icon)

---

## 5. Non-Goals (Out of Scope)

The following are explicitly **not** included in this version:

1. **Full music player features**: No playlist management, no shuffle/repeat, no music library
2. **Other media sources**: Only YouTube links supported (no Spotify, Apple Music, SoundCloud, etc.)
3. **Custom terminal monitoring rules**: Users cannot define custom rules for what "running" means
4. **Cross-platform support**: macOS only (no Windows/Linux)
5. **Cloud sync**: Music assignments are stored locally only
6. **Terminal command injection**: The app will not execute commands in terminals or interact with terminal input
7. **Advanced notifications**: No notification center alerts, no sound effects beyond music playback
8. **Terminal recording/logging**: The app will not record or log terminal output content
9. **Multiple music tracks per terminal**: Each terminal can only have one assigned YouTube link

---

## 6. Design Considerations

### UI/UX Requirements
- **Menu Bar Icon**: Small, simple icon with color-coded status (green/yellow/red)
- **Panel Design**: Similar to AgentWatch aesthetic:
  - Clean white/light background
  - Rounded corners for session cards
  - Clear status indicators (colored dots or badges)
  - Minimalist button design
  - System-native macOS appearance (SF Symbols, standard fonts)
- **Modal for Link Assignment**: Simple popup with:
  - Input field for YouTube URL
  - "Save" and "Cancel" buttons
  - Validation error messages if URL is invalid

### Interaction Flow
1. User launches app → Icon appears in menu bar
2. User clicks icon → Panel opens showing detected terminals
3. User clicks a terminal entry → Modal opens to paste YouTube link
4. User pastes link and clicks "Save" → Music assigned, modal closes
5. Terminal starts running task → Music starts playing automatically
6. Terminal finishes task → Music stops automatically (silence signals completion)
7. User can manually control playback at any time via panel buttons

---

## 7. Technical Considerations

### macOS Terminal Session Detection
- **Recommended Approach**: Leverage AgentWatch's open-source monitoring implementation
  - **AgentWatch Integration**: Use or adapt AgentWatch's terminal session detection logic (available at https://github.com/cyberark/agentwatch)
  - **Benefits**: Proven session monitoring, community-tested, handles multiple terminal emulators
  - **Implementation**: Fork/adapt the relevant monitoring modules or use as a reference for Swift implementation
- **Alternative Approach** (if AgentWatch integration is not feasible):
  - **Swift + Cocoa**: Native macOS app development
  - **Process monitoring**: Use `NSWorkspace` or `Process` APIs to detect Terminal.app, iTerm2, etc.
  - **Accessibility APIs**: Monitor terminal window titles and process states
  - **AppleScript**: Query terminal applications for active sessions
- **Session Status Detection**:
  - Monitor terminal process activity (high activity = running, low activity = idle)
  - Track terminal output stream activity
  - Detect when terminal is waiting for user input (prompt detection)

### YouTube Playback Integration
- **Options**:
  - **Embedded WebView**: Use WKWebView to embed YouTube player
  - **YouTube API**: Use YouTube iframe API for playback control
  - **Third-party library**: Investigate Swift YouTube player libraries
- **Playback Control**: Must support programmatic play/pause/stop via API

### Data Persistence
- **UserDefaults**: Store music assignments (terminal ID → YouTube URL mapping)
- **Format**: JSON dictionary persisted locally

### Performance
- **Low CPU footprint**: Polling/monitoring should not impact system performance
- **Efficient updates**: Use event-driven updates where possible (not constant polling)

### Dependencies
- **Swift/SwiftUI**: For native macOS app
- **AVFoundation**: For media playback (if not using WebView)
- **AppKit**: For menu bar integration
- **AgentWatch** (optional): Reference or adapt open-source terminal monitoring logic from https://github.com/cyberark/agentwatch

---

## 8. Success Metrics

### Functionality Metrics
1. **Detection Accuracy**: App detects 100% of active Terminal.app and iTerm2 sessions
2. **Status Accuracy**: Terminal status (running/idle) is correctly identified ≥95% of the time
3. **Playback Reliability**: Music auto-plays within 2 seconds of terminal task starting
4. **Stop Reliability**: Music auto-stops within 2 seconds of terminal task completion
5. **Sync Latency**: Status updates appear in UI within 2 seconds of actual state change

### User Experience Metrics
1. **Setup Time**: Users can assign music to a terminal in <30 seconds
2. **CPU Usage**: App uses <5% CPU on average
3. **Memory Usage**: App uses <100MB RAM
4. **User Satisfaction**: Developers find the notification system useful and non-intrusive (qualitative feedback)

---

## 9. Open Questions

1. **YouTube API Limitations**: Are there rate limits or restrictions on embedded YouTube playback in macOS apps?
2. **Terminal Detection**: Can we reliably detect all terminal emulators (Terminal.app, iTerm2, Warp, Alacritty, etc.) or should we focus on the most common ones?
3. **Permissions**: What macOS permissions (Accessibility, Screen Recording, etc.) will be required for terminal monitoring?
4. **Claude Code Specifics**: Does Claude Code output any specific indicators in the terminal when tasks start/finish that we can reliably detect?
5. **Multiple Terminal Windows**: If a user has 10+ terminal sessions, should we add pagination/search in the panel UI?
6. **YouTube Premium**: Should we add support for YouTube Premium users to avoid ads during playback?
7. **App Distribution**: Will this be distributed via Mac App Store, direct download, or Homebrew?
8. **Session Persistence**: Should the app "remember" closed terminal sessions (and their music) if they're reopened?

---

## Appendix: Reference Screenshots

- **AgentWatch Reference**: See provided screenshot showing session list with "Running/Session Finished" status indicators
- **Target Aesthetic**: Clean, minimal panel UI similar to AgentWatch with session cards and status badges

---

**Document Version**: 1.1
**Created**: 2025-11-12
**Last Updated**: 2025-11-12
**Target Audience**: Junior Developer
**Status**: Updated - Flipped Playback Logic (Music plays during execution, stops on completion)
