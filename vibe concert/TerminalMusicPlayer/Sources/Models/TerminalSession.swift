import Foundation

/// Represents a terminal session being monitored
struct TerminalSession: Identifiable, Codable, Equatable {
    let id: String
    var name: String
    var status: SessionStatus
    var processID: pid_t
    var lastActivity: Date
    var applicationName: String // e.g., "Terminal", "iTerm2"

    enum SessionStatus: String, Codable {
        case running = "Running"
        case idle = "Idle"
        case unknown = "Unknown"
    }

    init(id: String = UUID().uuidString,
         name: String,
         status: SessionStatus = .unknown,
         processID: pid_t,
         applicationName: String) {
        self.id = id
        self.name = name
        self.status = status
        self.processID = processID
        self.lastActivity = Date()
        self.applicationName = applicationName
    }

    mutating func updateActivity() {
        self.lastActivity = Date()
    }

    mutating func updateStatus(_ newStatus: SessionStatus) {
        if self.status != newStatus {
            self.status = newStatus
            self.lastActivity = Date()
        }
    }
}
