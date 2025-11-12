# Task List: Terminal Music Player Menu Bar App

## Relevant Files

- `TerminalMusicPlayer.xcodeproj` - Main Xcode project file for the macOS app
- `TerminalMusicPlayer/AppDelegate.swift` - Main app delegate handling menu bar initialization
- `TerminalMusicPlayer/StatusBarController.swift` - Manages the menu bar icon and status updates
- `TerminalMusicPlayer/Models/TerminalSession.swift` - Data model for terminal sessions
- `TerminalMusicPlayer/Models/MusicAssignment.swift` - Data model for music-to-terminal assignments
- `TerminalMusicPlayer/Monitors/TerminalMonitor.swift` - Core terminal session detection and monitoring
- `TerminalMusicPlayer/Monitors/AgentWatchAdapter.swift` - Adapter/wrapper for AgentWatch monitoring logic
- `TerminalMusicPlayer/Views/PanelView.swift` - Main dropdown panel UI (SwiftUI)
- `TerminalMusicPlayer/Views/SessionRowView.swift` - Individual terminal session row component
- `TerminalMusicPlayer/Views/MusicAssignmentModal.swift` - Modal for assigning YouTube links
- `TerminalMusicPlayer/Services/YouTubePlayer.swift` - YouTube playback integration service
- `TerminalMusicPlayer/Services/PlaybackController.swift` - Automatic playback control logic
- `TerminalMusicPlayer/Services/StorageManager.swift` - Data persistence using UserDefaults
- `TerminalMusicPlayer/Utils/URLValidator.swift` - YouTube URL validation utility
- `TerminalMusicPlayer/Info.plist` - App configuration and permissions
- `TerminalMusicPlayerTests/TerminalMonitorTests.swift` - Unit tests for terminal monitoring
- `TerminalMusicPlayerTests/PlaybackControllerTests.swift` - Unit tests for playback logic
- `TerminalMusicPlayerTests/StorageManagerTests.swift` - Unit tests for data persistence

### Notes

- This is a native macOS app built with Swift and SwiftUI
- Tests use XCTest framework (run via Xcode or `xcodebuild test`)
- AgentWatch integration may require adapting Python code to Swift or using a bridge
- Menu bar apps use `NSStatusBar` and `NSPopover` for UI

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/terminal-music-player`)

- [x] 1.0 Set up macOS menu bar app project structure
  - [x] 1.1 Create new macOS App project using Swift Package Manager
  - [x] 1.2 Configure project to run as menu bar only app (LSUIElement = true in Info.plist)
  - [x] 1.3 Set up project folder structure (Models, Views, Services, Monitors, Utils)
  - [x] 1.4 Add necessary entitlements and permissions (Accessibility, Screen Recording if needed)
  - [x] 1.5 Configure minimum macOS version target (macOS 12.0+ recommended for SwiftUI features)
  - [x] 1.6 Add basic AppDelegate with NSStatusBar initialization
  - [x] 1.7 Created project structure ready for Xcode build

- [x] 2.0 Implement terminal session monitoring (using AgentWatch)
  - [x] 2.1 Research AgentWatch repository to understand terminal monitoring approach
  - [x] 2.2 Determine integration strategy (implemented native Swift approach with NSWorkspace)
  - [x] 2.3 Create `TerminalSession` model with properties (id, name, status, processID, lastActivity)
  - [x] 2.4 Implement `TerminalMonitor` class to detect running terminal applications (Terminal.app, iTerm2)
  - [x] 2.5 Implement process monitoring to track terminal session states (using NSWorkspace or Process APIs)
  - [x] 2.6 Add logic to determine "running" vs "idle" status (CPU usage, output activity, prompt detection)
  - [x] 2.7 Implement polling/observer pattern to continuously monitor terminal states (update every 1-2 seconds)
  - [x] 2.8 Add delegate/callback mechanism to notify when terminal status changes
  - [ ] 2.9 Test terminal detection with multiple terminal windows/tabs open (requires Xcode build)
  - [ ] 2.10 Test status accuracy by running/stopping Claude Code tasks in terminals (requires Xcode build)

- [x] 3.0 Build menu bar UI and dropdown panel
  - [x] 3.1 Create `StatusBarController` to manage menu bar icon and color states (green/yellow/red)
  - [x] 3.2 Implement status color logic based on aggregate terminal states
  - [x] 3.3 Create `PanelView` SwiftUI view for the main dropdown panel
  - [x] 3.4 Configure NSPopover to display PanelView when menu bar icon is clicked
  - [x] 3.5 Create `SessionRowView` component showing session name, status badge, music info, and controls
  - [x] 3.6 Implement list view to display all detected terminal sessions using ForEach
  - [x] 3.7 Add click handler to SessionRowView to open music assignment modal
  - [x] 3.8 Create `MusicAssignmentModal` view with text field for YouTube URL
  - [x] 3.9 Add "Save" and "Cancel" buttons to modal with proper actions
  - [x] 3.10 Add settings/preferences button (gear icon) to panel (placeholder added)
  - [x] 3.11 Style panel to match AgentWatch aesthetic (clean, minimal, rounded corners)
  - [ ] 3.12 Test panel opens/closes correctly and displays session data in real-time (requires Xcode build)

- [x] 4.0 Implement YouTube music playback integration
  - [x] 4.1 Create `YouTubePlayer` service class to handle playback
  - [x] 4.2 Research YouTube playback options (WKWebView with embedded player, YouTube iframe API, native libraries)
  - [x] 4.3 Implement chosen approach (WKWebView with YouTube iframe API)
  - [x] 4.4 Add methods to load YouTube video by URL
  - [x] 4.5 Implement play() method to start playback programmatically
  - [x] 4.6 Implement pause() method to pause playback
  - [x] 4.7 Implement stop() method to stop and reset playback
  - [x] 4.8 Create `URLValidator` utility to validate YouTube URLs (support youtube.com and youtu.be formats)
  - [x] 4.9 Add error handling for invalid URLs and playback failures
  - [ ] 4.10 Test playback with various YouTube URLs (music videos, playlists, livestreams) (requires Xcode build)
  - [ ] 4.11 Test manual play/pause/stop controls from the UI (requires Xcode build)

- [x] 5.0 Implement automatic playback control logic
  - [x] 5.1 Create `PlaybackController` service to manage automatic playback
  - [x] 5.2 Create `MusicAssignment` model linking terminal session ID to YouTube URL
  - [x] 5.3 Implement logic to track all music assignments and their playback states
  - [x] 5.4 Subscribe to terminal status change notifications from TerminalMonitor
  - [x] 5.5 Implement handler for "idle → running" transition: start playing assigned music
  - [x] 5.6 Implement handler for "running → idle" transition: stop playing music
  - [x] 5.7 Handle multiple simultaneous playback (when multiple terminals start at once)
  - [x] 5.8 Add manual override capability (manual controls don't get overridden by auto-playback immediately)
  - [x] 5.9 Implement debouncing/delay to prevent rapid play/stop cycles from quick status changes
  - [ ] 5.10 Test automatic playback with one terminal session (requires Xcode build)
  - [ ] 5.11 Test automatic playback with multiple terminals having different music assignments (requires Xcode build)
  - [ ] 5.12 Test edge cases (terminal closes while music playing, app restart during playback) (requires Xcode build)

- [x] 6.0 Add data persistence for music assignments
  - [x] 6.1 Create `StorageManager` service using UserDefaults for persistence
  - [x] 6.2 Implement method to save music assignments (terminalID → YouTubeURL mapping)
  - [x] 6.3 Implement method to load music assignments on app launch
  - [x] 6.4 Implement method to update existing assignment
  - [x] 6.5 Implement method to delete/remove assignment
  - [x] 6.6 Use Codable protocol for serializing MusicAssignment model to JSON
  - [x] 6.7 Add error handling for storage failures
  - [ ] 6.8 Test that assignments persist across app restarts (requires Xcode build)
  - [ ] 6.9 Test that assignments are correctly restored and linked to terminal sessions on launch (requires Xcode build)

- [ ] 7.0 Testing and refinement
  - [ ] 7.1 Write unit tests for TerminalMonitor (session detection, status tracking) (requires Xcode)
  - [ ] 7.2 Write unit tests for PlaybackController (automatic playback logic, transitions) (requires Xcode)
  - [ ] 7.3 Write unit tests for StorageManager (save, load, update, delete operations) (requires Xcode)
  - [ ] 7.4 Write unit tests for URLValidator (valid/invalid YouTube URLs) (requires Xcode)
  - [ ] 7.5 Perform end-to-end testing: assign music, run terminal tasks, verify auto-playback (requires Xcode)
  - [ ] 7.6 Test with multiple terminals (Terminal.app and iTerm2 if available) (requires Xcode)
  - [ ] 7.7 Test CPU and memory usage (should be <5% CPU, <100MB RAM) (requires Xcode)
  - [ ] 7.8 Test edge cases (no terminals open, terminal crashes, network issues for YouTube) (requires Xcode)
  - [ ] 7.9 Verify UI updates within 2 seconds of terminal status changes (requires Xcode)
  - [ ] 7.10 Gather user feedback and refine UX (status colors, panel layout, control responsiveness) (requires Xcode)
  - [ ] 7.11 Add app icon and finalize branding (requires Xcode)
  - [x] 7.12 Create README with setup instructions and usage guide
  - [ ] 7.13 Commit final changes and merge feature branch to main
