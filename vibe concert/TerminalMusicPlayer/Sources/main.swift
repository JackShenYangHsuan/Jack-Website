import Cocoa
import SwiftUI
import AVFoundation
import AVFAudio

// Helper function to log to file
func logToFile(_ message: String) {
    let logPath = "/tmp/musicplayer.log"
    let timestamp = Date()
    let logMessage = "[\(timestamp)] \(message)\n"
    if let data = logMessage.data(using: .utf8) {
        if FileManager.default.fileExists(atPath: logPath) {
            if let fileHandle = FileHandle(forWritingAtPath: logPath) {
                fileHandle.seekToEndOfFile()
                fileHandle.write(data)
                fileHandle.closeFile()
            }
        } else {
            try? data.write(to: URL(fileURLWithPath: logPath))
        }
    }
}

// MARK: - Session Models
struct ClaudeSession: Codable {
    let sessionId: String
    let status: String
    let timestamp: Int
    let workingDirectory: String
    let projectName: String
    let musicURL: String
}

struct RunningSession: Identifiable, Codable {
    var id: Int { pid }
    let pid: Int
    let workingDirectory: String
    let projectName: String
    let startTime: String
    let cpuUsage: Double
    let cpuTime: TimeInterval  // Cumulative CPU time in seconds
    let rss: Int  // Memory in KB
    var isActive: Bool
}

// MARK: - Activity Detector
class ActivityDetector {
    private var previousCPUTime: [Int: TimeInterval] = [:]
    private var lastHistoryModTime: Date?
    private let historyPath: String

    init() {
        let homeDir = FileManager.default.homeDirectoryForCurrentUser.path
        self.historyPath = "\(homeDir)/.claude/history.jsonl"
    }

    func isSessionActive(pid: Int, cpuTime: TimeInterval, rss: Int) -> Bool {
        var score = 0

        // Signal 1: History file modified in last 5 seconds (40 points)
        if let modTime = getHistoryModTime(),
           Date().timeIntervalSince(modTime) < 5.0 {
            score += 40
            logToFile("Activity signal - History file: +40 (modified \(Date().timeIntervalSince(modTime))s ago)")
        }

        // Signal 2: Network connections (30 points)
        if hasNetworkConnections(pid: pid) {
            score += 30
            logToFile("Activity signal - Network: +30")
        }

        // Signal 3: CPU time delta (20 points)
        if let prevTime = previousCPUTime[pid] {
            let delta = cpuTime - prevTime
            if delta > 0.1 {
                score += 20
                logToFile("Activity signal - CPU time delta: +20 (delta: \(delta)s)")
            }
        }
        previousCPUTime[pid] = cpuTime

        // Signal 4: Memory baseline (10 points)
        if rss > 150_000 {
            score += 10
            logToFile("Activity signal - Memory: +10 (RSS: \(rss)KB)")
        }

        let isActive = score >= 50
        logToFile("PID \(pid) activity score: \(score)/100 -> \(isActive ? "ACTIVE" : "IDLE")")
        return isActive
    }

    private func getHistoryModTime() -> Date? {
        do {
            let attrs = try FileManager.default.attributesOfItem(atPath: historyPath)
            let modTime = attrs[.modificationDate] as? Date
            return modTime
        } catch {
            logToFile("Could not read history file mod time: \(error)")
            return nil
        }
    }

    private func hasNetworkConnections(pid: Int) -> Bool {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/sbin/lsof")
        process.arguments = ["-p", "\(pid)", "-a", "-i"]

        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = Pipe()

        do {
            try process.run()

            // Set a timeout of 0.5 seconds
            let timeoutDate = Date().addingTimeInterval(0.5)
            while process.isRunning && Date() < timeoutDate {
                Thread.sleep(forTimeInterval: 0.01)
            }

            if process.isRunning {
                process.terminate()
                logToFile("lsof timeout for PID \(pid)")
                return false
            }

            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8) {
                let lines = output.components(separatedBy: .newlines)
                // Look for ESTABLISHED connections
                let establishedCount = lines.filter { $0.contains("ESTABLISHED") }.count
                return establishedCount > 0
            }
        } catch {
            logToFile("lsof error: \(error)")
        }

        return false
    }
}

// MARK: - Session Monitor
class SessionMonitor: ObservableObject {
    @Published var runningSessions: [RunningSession] = []
    private var monitorTimer: Timer?
    private let activityDetector = ActivityDetector()

    weak var player: YouTubePlayer?

    func startMonitoring(player: YouTubePlayer) {
        self.player = player
        logToFile("SessionMonitor: Started monitoring with ActivityDetector")

        checkRunningProcesses()

        monitorTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.checkRunningProcesses()
        }
        RunLoop.main.add(monitorTimer!, forMode: .common)
    }

    private func checkRunningProcesses() {
        DispatchQueue.global(qos: .utility).async { [weak self] in
            guard let self = self else { return }

            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/bin/sh")
            process.arguments = ["-c", "ps aux | grep ' claude ' | grep -v grep"]

            let pipe = Pipe()
            process.standardOutput = pipe
            process.standardError = Pipe()

            do {
                try process.run()
                process.waitUntilExit()

                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                guard let output = String(data: data, encoding: .utf8), !output.isEmpty else {
                    DispatchQueue.main.async {
                        self.runningSessions = []
                    }
                    return
                }

                var sessions: [RunningSession] = []

                for line in output.components(separatedBy: "\n") {
                    let trimmedLine = line.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !trimmedLine.isEmpty else { continue }

                    let components = trimmedLine.split(separator: " ", omittingEmptySubsequences: true)
                    // ps aux format: USER PID %CPU %MEM VSZ RSS TT STAT STARTED TIME COMMAND
                    if components.count >= 11,
                       let pid = Int(components[1]),
                       let cpuUsage = Double(components[2]),
                       let rss = Int(components[5]) {

                        let workingDir = "Claude Code"
                        let projectName = "claude-\(pid)"
                        let startTime = String(components[8])
                        let timeStr = String(components[9])  // TIME field (e.g., "6:15.21")

                        // Parse TIME field to seconds
                        let cpuTime = self.parseCPUTime(timeStr)

                        // Use ActivityDetector to determine if session is active
                        let isActive = self.activityDetector.isSessionActive(
                            pid: pid,
                            cpuTime: cpuTime,
                            rss: rss
                        )

                        sessions.append(RunningSession(
                            pid: pid,
                            workingDirectory: workingDir,
                            projectName: projectName,
                            startTime: startTime,
                            cpuUsage: cpuUsage,
                            cpuTime: cpuTime,
                            rss: rss,
                            isActive: isActive
                        ))
                    }
                }

                DispatchQueue.main.async {
                    self.runningSessions = sessions

                    // Auto play/pause based on session activity
                    let hasActiveSessions = sessions.contains { $0.isActive }

                    // Debug logging
                    logToFile("Sessions: \(sessions.count), hasActive: \(hasActiveSessions), isPlaying: \(self.player?.isPlaying ?? false)")

                    if hasActiveSessions && !(self.player?.isPlaying ?? false) {
                        logToFile("ACTION: Starting playback")
                        self.player?.play()
                    } else if !hasActiveSessions && (self.player?.isPlaying ?? false) {
                        logToFile("ACTION: Pausing playback")
                        self.player?.pause()
                    }
                }

            } catch {
                logToFile("Error checking running processes: \(error)")
            }
        }
    }

    private func parseCPUTime(_ timeStr: String) -> TimeInterval {
        // Parse TIME format: "MM:SS.CC" or "HH:MM:SS" or "D-HH:MM:SS"
        // Examples: "6:15.21", "1:23:45", "2-03:45:12"

        var totalSeconds: TimeInterval = 0

        // Check for day format (e.g., "2-03:45:12")
        if timeStr.contains("-") {
            let parts = timeStr.split(separator: "-")
            if parts.count == 2,
               let days = Int(parts[0]) {
                totalSeconds += TimeInterval(days * 86400)
                let timePart = String(parts[1])
                totalSeconds += parseTimeComponent(timePart)
            }
        } else {
            totalSeconds = parseTimeComponent(timeStr)
        }

        return totalSeconds
    }

    private func parseTimeComponent(_ timeStr: String) -> TimeInterval {
        let parts = timeStr.split(separator: ":")
        var seconds: TimeInterval = 0

        if parts.count == 3 {
            // HH:MM:SS format
            if let hours = Int(parts[0]),
               let minutes = Int(parts[1]),
               let secs = Double(parts[2]) {
                seconds = TimeInterval(hours * 3600 + minutes * 60) + secs
            }
        } else if parts.count == 2 {
            // MM:SS.CC format
            if let minutes = Int(parts[0]),
               let secs = Double(parts[1]) {
                seconds = TimeInterval(minutes * 60) + secs
            }
        }

        return seconds
    }
}

// MARK: - YouTube Player
class YouTubePlayer: NSObject, ObservableObject {
    @Published var youtubeURL: String = "" {
        didSet {
            // Save the new URL
            UserDefaults.standard.set(youtubeURL, forKey: "savedYouTubeURL")

            // Check if we were playing before URL change
            let wasPlaying = isPlaying

            // Stop current playback completely - critical fix for URL switching
            audioPlayer?.stop()
            audioPlayer = nil
            isPlaying = false
            isLoading = false

            // Clear cached data
            cachedAudioFile = nil
            videoTitle = nil
            statusMessage = "Ready"

            // Fetch new video title
            if !youtubeURL.isEmpty {
                fetchVideoTitle()

                // If music was playing, automatically start the new URL
                if wasPlaying {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                        self?.play()
                    }
                }
            }
        }
    }
    @Published var isPlaying: Bool = false
    @Published var statusMessage: String = "Ready"
    @Published var videoTitle: String?

    private var audioPlayer: AVAudioPlayer?
    private var cachedAudioFile: String?
    private var ytdlpPath: String?
    private var isLoading: Bool = false  // Prevent multiple simultaneous downloads

    override init() {
        super.init()

        // Find yt-dlp path FIRST before setting URL
        ytdlpPath = findYtDlpPath()
        if ytdlpPath == nil {
            logToFile("ERROR: yt-dlp not found in PATH")
            statusMessage = "Error: yt-dlp not installed"
        }

        // Now set URL (this will trigger didSet which calls fetchVideoTitle)
        if let savedURL = UserDefaults.standard.string(forKey: "savedYouTubeURL") {
            youtubeURL = savedURL
        } else {
            // Default to Lofi Girl - reliable and popular coding music
            youtubeURL = "https://www.youtube.com/watch?v=jfKfPfyJRdk"
        }
    }

    private func findYtDlpPath() -> String? {
        // First, check bundled binary
        if let resourcePath = Bundle.main.resourcePath {
            let bundledPath = resourcePath + "/bin/yt-dlp"
            if FileManager.default.fileExists(atPath: bundledPath) {
                logToFile("Found bundled yt-dlp at: \(bundledPath)")
                return bundledPath
            }
        }

        // Then check common installation paths
        let commonPaths = [
            "/opt/homebrew/bin/yt-dlp",
            "/usr/local/bin/yt-dlp",
            "/usr/bin/yt-dlp"
        ]

        for path in commonPaths {
            if FileManager.default.fileExists(atPath: path) {
                logToFile("Found yt-dlp at: \(path)")
                return path
            }
        }

        // Try using 'which' to find it
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/which")
        process.arguments = ["yt-dlp"]

        let pipe = Pipe()
        process.standardOutput = pipe

        do {
            try process.run()
            process.waitUntilExit()

            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8) {
                let path = output.trimmingCharacters(in: .whitespacesAndNewlines)
                if !path.isEmpty && FileManager.default.fileExists(atPath: path) {
                    logToFile("Found yt-dlp via 'which': \(path)")
                    return path
                }
            }
        } catch {
            logToFile("Error running 'which yt-dlp': \(error)")
        }

        return nil
    }
    
    func play() {
        // Check if yt-dlp is available
        guard let ytdlpPath = ytdlpPath else {
            statusMessage = "Error: yt-dlp not found. Install with: brew install yt-dlp"
            logToFile("Cannot play: yt-dlp not found")
            return
        }

        // Prevent multiple simultaneous downloads
        guard !isLoading && !isPlaying else {
            logToFile("Already loading or playing, ignoring duplicate play() call")
            return
        }

        // If player exists and is paused, just resume
        if let player = audioPlayer {
            player.play()
            isPlaying = true
            statusMessage = "Playing"
            return
        }

        // Mark as loading to prevent duplicate calls
        isLoading = true

        // Otherwise download and setup new player
        let tempPath = NSTemporaryDirectory() + "music_\(UUID().uuidString)"

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }

            DispatchQueue.main.async {
                self.statusMessage = "Loading..."
            }

            let process = Process()
            process.executableURL = URL(fileURLWithPath: ytdlpPath)
            process.arguments = [
                "-f", "140",  // Format 140 is M4A/AAC audio (always available on YouTube)
                "-o", tempPath,
                "--no-cache-dir",
                "--no-playlist",
                self.youtubeURL
            ]

            let pipe = Pipe()
            process.standardOutput = pipe
            process.standardError = pipe

            do {
                try process.run()
                process.waitUntilExit()

                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                let output = String(data: data, encoding: .utf8) ?? ""

                logToFile("yt-dlp exit status: \(process.terminationStatus)")
                logToFile("yt-dlp output: \(output)")

                // Find the downloaded file (yt-dlp adds extension)
                let fileManager = FileManager.default
                let tempDir = NSTemporaryDirectory()

                do {
                    let files = try fileManager.contentsOfDirectory(atPath: tempDir)
                    let musicFiles = files.filter { $0.hasPrefix("music_") && !$0.hasSuffix(".part") }

                    // Sort by modification date, get most recent
                    let sortedFiles = musicFiles.compactMap { fileName -> (String, Date)? in
                        let fullPath = tempDir + fileName
                        guard let attrs = try? fileManager.attributesOfItem(atPath: fullPath),
                              let modDate = attrs[.modificationDate] as? Date else {
                            return nil
                        }
                        return (fullPath, modDate)
                    }.sorted { $0.1 > $1.1 }

                    if let downloadedFile = sortedFiles.first {
                        let downloadedPath = downloadedFile.0
                        logToFile("Found downloaded file: \(downloadedPath)")

                        if let attrs = try? fileManager.attributesOfItem(atPath: downloadedPath),
                           let fileSize = attrs[.size] as? Int {
                            logToFile("Downloaded file size: \(fileSize) bytes")

                            if fileSize > 1_000_000 { // At least 1MB
                                self.cachedAudioFile = downloadedPath
                                DispatchQueue.main.async {
                                    self.startPlayback(audioPath: downloadedPath)
                                    self.isLoading = false
                                }
                            } else {
                                DispatchQueue.main.async {
                                    self.statusMessage = "File too small: \(fileSize) bytes"
                                    self.isPlaying = false
                                    self.isLoading = false
                                }
                            }
                        }
                    } else {
                        DispatchQueue.main.async {
                            self.statusMessage = "Download failed: file not found"
                            self.isPlaying = false
                            self.isLoading = false
                        }
                    }
                } catch {
                    logToFile("Error finding downloaded file: \(error)")
                    DispatchQueue.main.async {
                        self.statusMessage = "Error: \(error.localizedDescription)"
                        self.isPlaying = false
                        self.isLoading = false
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    self.statusMessage = "Error: \(error.localizedDescription)"
                    self.isPlaying = false
                    self.isLoading = false
                }
            }
        }
    }

    private func startPlayback(audioPath: String) {
        do {
            let audioURL = URL(fileURLWithPath: audioPath)
            audioPlayer = try AVAudioPlayer(contentsOf: audioURL)
            audioPlayer?.volume = 1.0
            audioPlayer?.prepareToPlay()
            audioPlayer?.play()
            isPlaying = true
            statusMessage = "Playing"
            logToFile("Playback started successfully")
        } catch {
            statusMessage = "Failed: \(error.localizedDescription)"
            isPlaying = false
            isLoading = false
            logToFile("Playback failed: \(error.localizedDescription)")
        }
    }
    
    func pause() {
        audioPlayer?.pause()
        isPlaying = false
        statusMessage = "Paused"
    }
    
    private func fetchVideoTitle() {
        guard let ytdlpPath = ytdlpPath else {
            return
        }

        DispatchQueue.global(qos: .utility).async { [weak self] in
            guard let self = self else { return }

            let process = Process()
            process.executableURL = URL(fileURLWithPath: ytdlpPath)
            // Try to get title - may fail due to bot detection, but that's OK
            // We'll show the URL as fallback if title fetch fails
            process.arguments = [
                "--get-title",
                "--no-playlist",
                "--no-check-certificates",  // Skip cert validation for speed
                "--no-warnings",
                self.youtubeURL
            ]

            let pipe = Pipe()
            let errorPipe = Pipe()
            process.standardOutput = pipe
            process.standardError = errorPipe

            do {
                try process.run()
                process.waitUntilExit()

                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                let errorData = errorPipe.fileHandleForReading.readDataToEndOfFile()

                if process.terminationStatus != 0 {
                    // Title fetch failed (likely bot detection) - that's OK, we'll show URL instead
                    if let errorOutput = String(data: errorData, encoding: .utf8), !errorOutput.isEmpty {
                        // Only log first line of error to avoid spam
                        let firstErrorLine = errorOutput.components(separatedBy: .newlines).first ?? ""
                        logToFile("yt-dlp title fetch failed (expected for some videos): \(firstErrorLine)")
                    }

                    // Clear title on error - UI will show URL instead
                    DispatchQueue.main.async {
                        self.videoTitle = nil
                    }
                    return
                }

                if let output = String(data: data, encoding: .utf8) {
                    let title = output.components(separatedBy: .newlines).first?.trimmingCharacters(in: .whitespacesAndNewlines)

                    DispatchQueue.main.async {
                        if let title = title, !title.isEmpty {
                            self.videoTitle = title
                            logToFile("Fetched video title: \(title)")
                        } else {
                            self.videoTitle = nil
                            logToFile("Empty title returned for: \(self.youtubeURL)")
                        }
                    }
                }
            } catch {
                logToFile("Failed to fetch video title: \(error.localizedDescription)")
                DispatchQueue.main.async {
                    self.videoTitle = nil
                }
            }
        }
    }
}

// MARK: - NSTextField Wrapper for proper keyboard shortcut support
struct NSTextFieldWrapper: NSViewRepresentable {
    @Binding var text: String
    var placeholder: String

    func makeNSView(context: Context) -> NSTextField {
        let textField = NSTextField()
        textField.stringValue = text
        textField.delegate = context.coordinator
        textField.placeholderString = placeholder
        textField.bezelStyle = .roundedBezel
        textField.font = .systemFont(ofSize: 13)
        return textField
    }

    func updateNSView(_ nsView: NSTextField, context: Context) {
        if nsView.stringValue != text {
            nsView.stringValue = text
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, NSTextFieldDelegate {
        var parent: NSTextFieldWrapper

        init(_ parent: NSTextFieldWrapper) {
            self.parent = parent
        }

        func controlTextDidChange(_ notification: Notification) {
            if let textField = notification.object as? NSTextField {
                parent.text = textField.stringValue
            }
        }
    }
}

// MARK: - ContentView
struct ContentView: View {
    @ObservedObject var player: YouTubePlayer
    @ObservedObject var sessionMonitor: SessionMonitor
    @State private var isEditing = false
    @State private var editingURL = ""

    var body: some View {
        VStack(spacing: 16) {
            Text("Music Player")
                .font(.headline)
                .padding(.top, 8)
            
            // URL input/display section
            if isEditing {
                HStack {
                    NSTextFieldWrapper(text: $editingURL, placeholder: "YouTube URL")
                        .frame(height: 22)

                    Button("Save") {
                        player.youtubeURL = editingURL
                        isEditing = false
                    }
                    .buttonStyle(.borderedProminent)

                    Button("Cancel") {
                        editingURL = player.youtubeURL
                        isEditing = false
                    }
                }
                .padding(.horizontal)
            } else {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        if let title = player.videoTitle {
                            Text(title)
                                .lineLimit(2)
                                .font(.system(size: 13))
                                .foregroundColor(.primary)
                        } else if player.youtubeURL.isEmpty {
                            Text("No URL set")
                                .font(.system(size: 13))
                                .foregroundColor(.secondary)
                        } else {
                            // Show URL as fallback if title unavailable
                            Text(player.youtubeURL)
                                .lineLimit(2)
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                                .opacity(0.8)
                        }
                    }
                    
                    Spacer()
                    
                    Button("Edit") {
                        editingURL = player.youtubeURL
                        isEditing = true
                    }
                    .buttonStyle(.bordered)
                }
                .padding(.horizontal)
            }
            
            // Playback controls
            HStack(spacing: 20) {
                Button(action: {
                    if player.isPlaying {
                        player.pause()
                    } else {
                        player.play()
                    }
                }) {
                    Image(systemName: player.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 40))
                }
                .buttonStyle(.plain)
                .disabled(player.youtubeURL.isEmpty)
            }
            
            // Status text
            Text(player.statusMessage)
                .font(.caption)
                .foregroundColor(.secondary)
                .padding(.bottom, 8)

            // Divider
            Divider()
                .padding(.horizontal)

            // Claude Code Sessions Section
            VStack(alignment: .leading, spacing: 8) {
                Text("Claude Code Sessions (\(sessionMonitor.runningSessions.count))")
                    .font(.headline)
                    .padding(.horizontal)

                if sessionMonitor.runningSessions.isEmpty {
                    Text("No active sessions")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                } else {
                    ScrollView {
                        VStack(spacing: 6) {
                            ForEach(sessionMonitor.runningSessions) { session in
                                HStack(spacing: 8) {
                                    Circle()
                                        .fill(session.isActive ? Color.green : Color.orange)
                                        .frame(width: 8, height: 8)

                                    VStack(alignment: .leading, spacing: 2) {
                                        HStack(spacing: 4) {
                                            Text(session.projectName)
                                                .font(.system(size: 12, weight: .medium))
                                            Text(session.isActive ? "Running" : "Idle")
                                                .font(.system(size: 9, weight: .bold))
                                                .foregroundColor(session.isActive ? .green : .orange)
                                                .padding(.horizontal, 4)
                                                .padding(.vertical, 2)
                                                .background(session.isActive ? Color.green.opacity(0.1) : Color.orange.opacity(0.1))
                                                .cornerRadius(3)
                                        }
                                        Text(session.workingDirectory)
                                            .font(.system(size: 10))
                                            .foregroundColor(.secondary)
                                            .lineLimit(1)
                                            .truncationMode(.middle)
                                    }

                                    Spacer()

                                    VStack(alignment: .trailing, spacing: 2) {
                                        Text("PID \(session.pid)")
                                            .font(.system(size: 9))
                                            .foregroundColor(.secondary)
                                        Text("CPU: \(String(format: "%.1f", session.cpuUsage))%")
                                            .font(.system(size: 9))
                                            .foregroundColor(.secondary)
                                    }
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(Color.white)
                                .cornerRadius(6)
                                .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
                            }
                        }
                        .padding(.horizontal)
                    }
                    .frame(maxHeight: 200)
                }
            }
            .padding(.bottom, 8)

            // Divider
            Divider()
                .padding(.horizontal)

            // Quit button
            Button(action: {
                NSApplication.shared.terminate(nil)
            }) {
                HStack {
                    Image(systemName: "power")
                    Text("Quit")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
            }
            .buttonStyle(.bordered)
            .tint(.red)
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
        .frame(width: 400, height: 550)
    }
}

// MARK: - AppDelegate
class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem!
    var popover: NSPopover!
    var player: YouTubePlayer!
    var sessionMonitor: SessionMonitor!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Initialize player and monitor
        player = YouTubePlayer()
        sessionMonitor = SessionMonitor()

        // Start monitoring immediately
        sessionMonitor.startMonitoring(player: player)

        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)

        if let button = statusItem.button {
            let circleImage = createCircleIcon()
            button.image = circleImage
            button.action = #selector(togglePopover)
            button.target = self
        }

        popover = NSPopover()
        popover.contentSize = NSSize(width: 400, height: 550)
        popover.behavior = .transient

        // Pass the shared instances to ContentView
        let contentView = ContentView(player: player, sessionMonitor: sessionMonitor)
        popover.contentViewController = NSHostingController(rootView: contentView)
    }
    
    @objc func togglePopover() {
        if let button = statusItem.button {
            if popover.isShown {
                popover.performClose(nil)
            } else {
                popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            }
        }
    }
    
    func createCircleIcon() -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let image = NSImage(size: size)
        
        image.lockFocus()
        NSColor.white.setFill()
        let circlePath = NSBezierPath(ovalIn: NSRect(x: 2, y: 2, width: 14, height: 14))
        circlePath.fill()
        image.unlockFocus()
        image.isTemplate = true
        
        return image
    }
}

// MARK: - Main Entry Point
@main
struct TerminalMusicPlayerApp {
    static func main() {
        let app = NSApplication.shared
        let delegate = AppDelegate()
        app.delegate = delegate
        app.setActivationPolicy(.accessory)
        app.run()
    }
}
