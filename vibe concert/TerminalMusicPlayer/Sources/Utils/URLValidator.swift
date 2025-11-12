import Foundation

/// Utility class for validating YouTube URLs
class URLValidator {

    /// Validates if a given string is a valid YouTube URL
    /// Supports formats:
    /// - https://www.youtube.com/watch?v=VIDEO_ID
    /// - https://youtube.com/watch?v=VIDEO_ID
    /// - https://youtu.be/VIDEO_ID
    /// - https://m.youtube.com/watch?v=VIDEO_ID
    static func isValidYouTubeURL(_ urlString: String) -> Bool {
        guard let url = URL(string: urlString) else {
            return false
        }

        guard let host = url.host else {
            return false
        }

        // Check for youtube.com formats
        if host.contains("youtube.com") {
            // Must have a video ID in query parameters
            guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
                  let queryItems = components.queryItems,
                  let videoID = queryItems.first(where: { $0.name == "v" })?.value,
                  !videoID.isEmpty else {
                return false
            }
            return true
        }

        // Check for youtu.be format
        if host.contains("youtu.be") {
            // Video ID should be in the path
            let pathComponents = url.pathComponents.filter { $0 != "/" }
            return !pathComponents.isEmpty && !pathComponents[0].isEmpty
        }

        return false
    }

    /// Extracts video ID from a YouTube URL
    static func extractVideoID(from urlString: String) -> String? {
        guard let url = URL(string: urlString),
              let host = url.host else {
            return nil
        }

        // youtube.com format
        if host.contains("youtube.com") {
            guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
                  let queryItems = components.queryItems,
                  let videoID = queryItems.first(where: { $0.name == "v" })?.value else {
                return nil
            }
            return videoID
        }

        // youtu.be format
        if host.contains("youtu.be") {
            let pathComponents = url.pathComponents.filter { $0 != "/" }
            return pathComponents.first
        }

        return nil
    }

    /// Normalizes a YouTube URL to a standard format
    static func normalizeYouTubeURL(_ urlString: String) -> String? {
        guard let videoID = extractVideoID(from: urlString) else {
            return nil
        }
        return "https://www.youtube.com/watch?v=\(videoID)"
    }
}
