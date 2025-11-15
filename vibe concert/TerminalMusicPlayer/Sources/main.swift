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
    var isActive: Bool {
        cpuUsage > 10.0  // Consider active if CPU > 10%
    }
}

// MARK: - Session Monitor
class SessionMonitor: ObservableObject {
    @Published var runningSessions: [RunningSession] = []
    private var monitorTimer: Timer?

    weak var player: YouTubePlayer?

    func startMonitoring(player: YouTubePlayer) {
        self.player = player
        logToFile("SessionMonitor: Started monitoring")

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
                    if components.count >= 11,
                       let pid = Int(components[1]),
                       let cpuUsage = Double(components[2]) {

                        let workingDir = "Claude Code"
                        let projectName = "claude-\(pid)"
                        let startTime = String(components[8])

                        sessions.append(RunningSession(
                            pid: pid,
                            workingDirectory: workingDir,
                            projectName: projectName,
                            startTime: startTime,
                            cpuUsage: cpuUsage
                        ))
                    }
                }

                DispatchQueue.main.async {
                    self.runningSessions = sessions

                    // Auto play/pause based on session activity
                    let hasActiveSessions = sessions.contains { $0.isActive }

                    // Debug logging
                    let cpuValues = sessions.map { $0.cpuUsage }
                    logToFile("CPU values: \(cpuValues), hasActive: \(hasActiveSessions), isPlaying: \(self.player?.isPlaying ?? false)")

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
}

// MARK: - YouTube Player
class YouTubePlayer: NSObject, ObservableObject {
    @Published var youtubeURL: String = "" {
        didSet {
            UserDefaults.standard.set(youtubeURL, forKey: "savedYouTubeURL")
            cachedAudioFile = nil
            videoTitle = nil
            if !youtubeURL.isEmpty {
                fetchVideoTitle()
            }
        }
    }
    @Published var isPlaying: Bool = false
    @Published var statusMessage: String = "Ready"
    @Published var videoTitle: String?

    private var audioPlayer: AVAudioPlayer?
    private var cachedAudioFile: String?
    private var ytdlpPath: String?

    override init() {
        super.init()
        if let savedURL = UserDefaults.standard.string(forKey: "savedYouTubeURL") {
            youtubeURL = savedURL
        } else {
            youtubeURL = "https://www.youtube.com/watch?v=mQstYKoZ5O8&list=RDmQstYKoZ5O8&start_radio=1"
        }

        // Find yt-dlp path
        ytdlpPath = findYtDlpPath()
        if ytdlpPath == nil {
            logToFile("ERROR: yt-dlp not found in PATH")
            statusMessage = "Error: yt-dlp not installed"
        }

        if !youtubeURL.isEmpty {
            fetchVideoTitle()
        }
    }

    private func findYtDlpPath() -> String? {
        // Common installation paths
        let commonPaths = [
            "/opt/homebrew/bin/yt-dlp",
            "/usr/local/bin/yt-dlp",
            "/usr/bin/yt-dlp"
        ]

        // Check common paths first
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

        // If player exists and is paused, just resume
        if let player = audioPlayer, !isPlaying {
            player.play()
            isPlaying = true
            statusMessage = "Playing"
            return
        }

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
                                }
                            } else {
                                DispatchQueue.main.async {
                                    self.statusMessage = "File too small: \(fileSize) bytes"
                                    self.isPlaying = false
                                }
                            }
                        }
                    } else {
                        DispatchQueue.main.async {
                            self.statusMessage = "Download failed: file not found"
                            self.isPlaying = false
                        }
                    }
                } catch {
                    logToFile("Error finding downloaded file: \(error)")
                    DispatchQueue.main.async {
                        self.statusMessage = "Error: \(error.localizedDescription)"
                        self.isPlaying = false
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    self.statusMessage = "Error: \(error.localizedDescription)"
                    self.isPlaying = false
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
        } catch {
            statusMessage = "Failed: \(error.localizedDescription)"
            isPlaying = false
        }
    }
    
    func pause() {
        audioPlayer?.pause()
        isPlaying = false
        statusMessage = "Paused"
    }
    
    private func fetchVideoTitle() {
        guard let ytdlpPath = ytdlpPath else { return }

        DispatchQueue.global(qos: .utility).async { [weak self] in
            guard let self = self else { return }

            let process = Process()
            process.executableURL = URL(fileURLWithPath: ytdlpPath)
            process.arguments = ["--get-title", "--no-playlist", self.youtubeURL]

            let pipe = Pipe()
            process.standardOutput = pipe

            do {
                try process.run()
                process.waitUntilExit()

                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                if let output = String(data: data, encoding: .utf8) {
                    let title = output.components(separatedBy: .newlines).first?.trimmingCharacters(in: .whitespacesAndNewlines)

                    DispatchQueue.main.async {
                        self.videoTitle = title
                    }
                }
            } catch {
                // Ignore title fetch errors
            }
        }
    }
}

// MARK: - ContentView
struct ContentView: View {
    @StateObject private var player = YouTubePlayer()
    @StateObject private var sessionMonitor = SessionMonitor()
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
                    TextField("YouTube URL", text: $editingURL)
                        .textFieldStyle(.roundedBorder)
                    
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
                            Text("Loading title...")
                                .font(.system(size: 13))
                                .foregroundColor(.secondary)
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
        .onAppear {
            sessionMonitor.startMonitoring(player: player)
        }
    }
}

// MARK: - AppDelegate
class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem!
    var popover: NSPopover!
    
    func applicationDidFinishLaunching(_ notification: Notification) {
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
        popover.contentViewController = NSHostingController(rootView: ContentView())
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
