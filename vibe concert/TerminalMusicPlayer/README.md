# Terminal Music Player

A macOS menu bar application that monitors terminal sessions and automatically plays YouTube music based on terminal execution status.

## Features

- **Automatic Terminal Detection**: Monitors all running terminal sessions (Terminal.app, iTerm2, Warp, Alacritty)
- **Smart Music Playback**:
  - Music plays automatically when terminal is actively running
  - Music stops when terminal finishes (silence signals completion)
- **YouTube Integration**: Assign YouTube music links to specific terminal sessions
- **Menu Bar Status**: Color-coded icon shows aggregate terminal status
  - 🟢 Green: All terminals running (music playing)
  - 🟡 Orange: Mixed (some running, some idle)
  - 🔴 Red: All terminals idle (music stopped)
- **Manual Controls**: Override automatic playback with play/pause/stop buttons
- **Persistent Storage**: Music assignments saved across app restarts

## Architecture

### Project Structure

```
TerminalMusicPlayer/
├── Sources/
│   ├── AppDelegate.swift              # Main app entry point
│   ├── StatusBarController.swift      # Menu bar icon & popover management
│   ├── Models/
│   │   ├── TerminalSession.swift      # Terminal session data model
│   │   └── MusicAssignment.swift      # Music-to-terminal assignment model
│   ├── Monitors/
│   │   └── TerminalMonitor.swift      # Terminal session detection & monitoring
│   ├── Services/
│   │   ├── YouTubePlayer.swift        # YouTube playback via WKWebView
│   │   ├── PlaybackController.swift   # Automatic playback control logic
│   │   └── StorageManager.swift       # UserDefaults persistence
│   ├── Utils/
│   │   └── URLValidator.swift         # YouTube URL validation
│   └── Views/
│       ├── PanelView.swift            # Main dropdown panel UI
│       ├── SessionRowView.swift       # Individual session row component
│       └── MusicAssignmentModal.swift # Music assignment modal
├── Tests/
│   └── TerminalMusicPlayerTests/
├── Package.swift
├── Info.plist
└── README.md
```

### Key Components

#### 1. Terminal Monitoring (`TerminalMonitor.swift`)
- Uses `NSWorkspace` to detect running terminal applications
- Monitors process CPU usage to determine "running" vs "idle" status
- Polls every 2 seconds for status updates
- Notifies delegates when terminal status changes

#### 2. Playback Control (`PlaybackController.swift`)
- Core logic for automatic music playback
- Listens to terminal status changes via `TerminalMonitorDelegate`
- Manages multiple `YouTubePlayer` instances (one per terminal)
- Implements debouncing to prevent rapid play/stop cycles
- Handles manual override controls

#### 3. YouTube Playback (`YouTubePlayer.swift`)
- Embeds YouTube player using `WKWebView` and YouTube iframe API
- Supports play, pause, stop operations
- Handles playback state management
- Works with all YouTube URL formats

#### 4. Data Persistence (`StorageManager.swift`)
- Stores music assignments using `UserDefaults`
- JSON encoding/decoding with `Codable`
- Supports CRUD operations for assignments
- Automatic restore on app launch

#### 5. UI Components (SwiftUI)
- **PanelView**: Main dropdown showing all terminal sessions
- **SessionRowView**: Individual session card with status and controls
- **MusicAssignmentModal**: Modal for assigning YouTube URLs

## Building the App

### Requirements
- **macOS 12.0+** (Monterey or later)
- **Xcode 14.0+**
- **Swift 5.7+**

### Option 1: Build with Xcode (Recommended)

1. **Open Xcode** and select "File > Open"
2. Navigate to the `TerminalMusicPlayer` directory
3. Open `Package.swift`
4. **Build the project**: `Product > Build` (⌘+B)
5. **Run the app**: `Product > Run` (⌘+R)

### Option 2: Build with Swift Package Manager

```bash
cd TerminalMusicPlayer
swift build -c release
```

The built executable will be at:
`.build/release/TerminalMusicPlayer`

To run:
```bash
./.build/release/TerminalMusicPlayer
```

### Important Configuration

The `Info.plist` contains critical settings for menu bar operation:

- `LSUIElement = true`: Hides the app from the Dock (menu bar only)
- `NSAppleEventsUsageDescription`: Permission for terminal monitoring
- `NSAppleScriptEnabled = true`: Enable AppleScript for terminal detection

## Usage

### Getting Started

1. **Launch the app** - A music note icon appears in your menu bar
2. **Open terminals** - The app auto-detects Terminal.app, iTerm2, etc.
3. **Click the menu bar icon** - View all detected terminal sessions
4. **Assign music**:
   - Click on a terminal session
   - Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`)
   - Click "Save"

### Automatic Playback

Once music is assigned:
- **Terminal starts running** → Music plays automatically
- **Terminal finishes/becomes idle** → Music stops (completion signal)

### Manual Controls

Each session row has manual controls:
- ▶️ **Play**: Force play music
- ⏸️ **Pause**: Pause music
- ⏹️ **Stop**: Stop music completely

### Status Colors

The menu bar icon color indicates overall status:
- **🟢 Green**: All terminals running (music likely playing)
- **🟡 Orange**: Mixed states
- **🔴 Red**: All terminals idle (music stopped)
- **⚫ Gray**: No terminals detected

## Supported YouTube URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`

## Troubleshooting

### Terminals Not Detected

1. Check **System Preferences > Security & Privacy > Accessibility**
2. Ensure Terminal Music Player has accessibility permissions
3. Restart the app after granting permissions

### Music Not Playing

1. Check your internet connection (YouTube requires network access)
2. Verify the YouTube URL is valid
3. Check that the video is not region-restricted or age-restricted

### High CPU Usage

- The app polls terminal status every 2 seconds
- Expected CPU usage: <5% on average
- If higher, check for excessive terminal sessions

## Known Limitations

1. **Terminal Detection**: Currently monitors process-level activity, not individual terminal tabs
2. **Status Accuracy**: CPU-based heuristic may not be 100% accurate for all workflows
3. **YouTube API**: Requires internet connection; no offline playback
4. **Single Assignment**: Each terminal can only have one YouTube link assigned

## Future Enhancements

- [ ] Integrate AgentWatch for improved terminal monitoring
- [ ] Support for playlists
- [ ] Multiple music assignments per terminal
- [ ] Volume control
- [ ] Custom status detection rules
- [ ] Support for other music sources (Spotify, Apple Music)
- [ ] Terminal tab-level detection

## Development

### Running Tests

```bash
swift test
```

### Code Style

- SwiftLint configuration (if added)
- Follow Apple's Swift API Design Guidelines
- Document public APIs with Swift-style comments

## License

Personal project for demonstration purposes.

## Author

Jack Shen

## Credits

- Inspired by [AgentWatch](https://github.com/cyberark/agentwatch)
- Built with Swift, SwiftUI, and AppKit
