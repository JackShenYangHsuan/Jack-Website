import Foundation

/// Controls automatic music playback based on terminal session status
class PlaybackController {
    private var terminalMonitor: TerminalMonitor
    private var players: [String: YouTubePlayer] = [:] // Terminal session ID -> Player
    private var assignments: [String: MusicAssignment] = [:] // Terminal session ID -> Assignment
    private let storageManager = StorageManager.shared
    private var lastStatusChange: [String: Date] = [:]
    private let debounceInterval: TimeInterval = 1.0 // 1 second debounce

    init(terminalMonitor: TerminalMonitor) {
        self.terminalMonitor = terminalMonitor
        self.terminalMonitor.delegate = self
        loadAssignments()
        print("PlaybackController initialized")
    }

    // MARK: - Assignment Management

    /// Load all saved music assignments
    private func loadAssignments() {
        do {
            let savedAssignments = try storageManager.loadAssignments()
            for assignment in savedAssignments {
                assignments[assignment.terminalSessionID] = assignment
            }
            print("Loaded \(savedAssignments.count) music assignments")
        } catch {
            print("Error loading assignments: \(error)")
        }
    }

    /// Assign music to a terminal session
    func assignMusic(to terminalSessionID: String, youtubeURL: String, videoTitle: String? = nil) {
        // Validate URL
        guard URLValidator.isValidYouTubeURL(youtubeURL) else {
            print("Error: Invalid YouTube URL")
            return
        }

        // Normalize URL
        guard let normalizedURL = URLValidator.normalizeYouTubeURL(youtubeURL) else {
            print("Error: Could not normalize URL")
            return
        }

        // Create or update assignment
        var assignment = assignments[terminalSessionID] ?? MusicAssignment(
            terminalSessionID: terminalSessionID,
            youtubeURL: normalizedURL,
            videoTitle: videoTitle
        )

        assignment.youtubeURL = normalizedURL
        assignment.videoTitle = videoTitle
        assignments[terminalSessionID] = assignment

        // Create player if it doesn't exist
        if players[terminalSessionID] == nil {
            let player = YouTubePlayer()
            player.loadVideo(url: normalizedURL)
            players[terminalSessionID] = player
        } else {
            // Update existing player
            players[terminalSessionID]?.loadVideo(url: normalizedURL)
        }

        // Save to persistent storage
        do {
            try storageManager.saveAssignment(assignment)
            print("Assigned music to terminal \(terminalSessionID)")
        } catch {
            print("Error saving assignment: \(error)")
        }
    }

    /// Remove music assignment from a terminal session
    func removeAssignment(for terminalSessionID: String) {
        // Stop playback if active
        if let player = players[terminalSessionID] {
            player.stop()
            players.removeValue(forKey: terminalSessionID)
        }

        // Remove assignment
        assignments.removeValue(forKey: terminalSessionID)

        // Remove from storage
        do {
            try storageManager.deleteAssignment(for: terminalSessionID)
            print("Removed assignment for terminal \(terminalSessionID)")
        } catch {
            print("Error removing assignment: \(error)")
        }
    }

    /// Get assignment for a terminal session
    func getAssignment(for terminalSessionID: String) -> MusicAssignment? {
        return assignments[terminalSessionID]
    }

    /// Get all assignments
    func getAllAssignments() -> [MusicAssignment] {
        return Array(assignments.values)
    }

    // MARK: - Manual Playback Control

    /// Manually play music for a terminal session
    func play(for terminalSessionID: String) {
        guard let player = players[terminalSessionID] else {
            print("No player found for terminal \(terminalSessionID)")
            return
        }

        player.play()

        // Update assignment status
        if var assignment = assignments[terminalSessionID] {
            assignment.startPlaying()
            assignments[terminalSessionID] = assignment
        }

        print("Manually playing music for terminal \(terminalSessionID)")
    }

    /// Manually pause music for a terminal session
    func pause(for terminalSessionID: String) {
        guard let player = players[terminalSessionID] else {
            print("No player found for terminal \(terminalSessionID)")
            return
        }

        player.pause()

        // Update assignment status
        if var assignment = assignments[terminalSessionID] {
            assignment.stopPlaying()
            assignments[terminalSessionID] = assignment
        }

        print("Manually pausing music for terminal \(terminalSessionID)")
    }

    /// Manually stop music for a terminal session
    func stop(for terminalSessionID: String) {
        guard let player = players[terminalSessionID] else {
            print("No player found for terminal \(terminalSessionID)")
            return
        }

        player.stop()

        // Update assignment status
        if var assignment = assignments[terminalSessionID] {
            assignment.stopPlaying()
            assignments[terminalSessionID] = assignment
        }

        print("Manually stopping music for terminal \(terminalSessionID)")
    }

    // MARK: - Automatic Playback Control

    /// Handle terminal status change for automatic playback
    private func handleStatusChange(for session: TerminalSession) {
        // Check if there's a music assignment for this session
        guard let assignment = assignments[session.id] else {
            return
        }

        // Debounce rapid status changes
        if let lastChange = lastStatusChange[session.id] {
            let timeSinceLastChange = Date().timeIntervalSince(lastChange)
            if timeSinceLastChange < debounceInterval {
                print("Debouncing status change for \(session.id)")
                return
            }
        }

        lastStatusChange[session.id] = Date()

        // Get or create player
        let player = getOrCreatePlayer(for: session.id, assignment: assignment)

        // Handle status change based on PRD logic:
        // - Running → Play music
        // - Idle → Stop music
        switch session.status {
        case .running:
            player.play()
            var updatedAssignment = assignment
            updatedAssignment.startPlaying()
            assignments[session.id] = updatedAssignment
            print("Auto-playing music for terminal \(session.id) (status: running)")

        case .idle:
            player.stop()
            var updatedAssignment = assignment
            updatedAssignment.stopPlaying()
            assignments[session.id] = updatedAssignment
            print("Auto-stopping music for terminal \(session.id) (status: idle)")

        case .unknown:
            // Don't change playback for unknown status
            break
        }
    }

    /// Get existing player or create new one
    private func getOrCreatePlayer(for terminalSessionID: String, assignment: MusicAssignment) -> YouTubePlayer {
        if let existingPlayer = players[terminalSessionID] {
            return existingPlayer
        }

        let player = YouTubePlayer()
        player.loadVideo(url: assignment.youtubeURL)
        players[terminalSessionID] = player
        return player
    }

    // MARK: - Status Query

    /// Check if music is currently playing for a terminal session
    func isPlaying(for terminalSessionID: String, completion: @escaping (Bool) -> Void) {
        guard let player = players[terminalSessionID] else {
            completion(false)
            return
        }

        player.isPlaying(completion: completion)
    }
}

// MARK: - TerminalMonitorDelegate

extension PlaybackController: TerminalMonitorDelegate {
    func terminalMonitor(_ monitor: TerminalMonitor, didDetectSessions sessions: [TerminalSession]) {
        print("Detected \(sessions.count) terminal sessions")

        // Load players for sessions with existing assignments
        for session in sessions {
            if let assignment = assignments[session.id],
               players[session.id] == nil {
                let player = YouTubePlayer()
                player.loadVideo(url: assignment.youtubeURL)
                players[session.id] = player
                print("Created player for existing assignment: \(session.id)")
            }
        }
    }

    func terminalMonitor(_ monitor: TerminalMonitor, sessionDidChangeStatus session: TerminalSession) {
        print("Terminal session \(session.id) status changed to: \(session.status.rawValue)")
        handleStatusChange(for: session)
    }
}
