import Foundation

/// Represents a music assignment linking a terminal session to a YouTube URL
struct MusicAssignment: Identifiable, Codable, Equatable {
    let id: String
    var terminalSessionID: String
    var youtubeURL: String
    var videoTitle: String?
    var isPlaying: Bool
    var createdAt: Date
    var lastPlayedAt: Date?

    init(id: String = UUID().uuidString,
         terminalSessionID: String,
         youtubeURL: String,
         videoTitle: String? = nil) {
        self.id = id
        self.terminalSessionID = terminalSessionID
        self.youtubeURL = youtubeURL
        self.videoTitle = videoTitle
        self.isPlaying = false
        self.createdAt = Date()
        self.lastPlayedAt = nil
    }

    mutating func startPlaying() {
        self.isPlaying = true
        self.lastPlayedAt = Date()
    }

    mutating func stopPlaying() {
        self.isPlaying = false
    }

    /// Get display name for the music (title if available, otherwise URL)
    var displayName: String {
        return videoTitle ?? extractVideoIDFromURL() ?? youtubeURL
    }

    private func extractVideoIDFromURL() -> String? {
        // Extract video ID from YouTube URL
        if let url = URL(string: youtubeURL) {
            if url.host?.contains("youtube.com") == true,
               let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
               let videoID = components.queryItems?.first(where: { $0.name == "v" })?.value {
                return videoID
            } else if url.host?.contains("youtu.be") == true {
                return url.lastPathComponent
            }
        }
        return nil
    }
}
