import Foundation

/// Manages persistent storage of music assignments using UserDefaults
class StorageManager {
    static let shared = StorageManager()

    private let userDefaults = UserDefaults.standard
    private let assignmentsKey = "musicAssignments"

    private init() {
        print("StorageManager initialized")
    }

    // MARK: - Save Operations

    /// Save all music assignments
    func saveAssignments(_ assignments: [MusicAssignment]) throws {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(assignments)
            userDefaults.set(data, forKey: assignmentsKey)
            print("Saved \(assignments.count) music assignments")
        } catch {
            print("Error saving assignments: \(error)")
            throw StorageError.encodingFailed(error)
        }
    }

    /// Save a single music assignment (updates or adds)
    func saveAssignment(_ assignment: MusicAssignment) throws {
        var assignments = try loadAssignments()

        // Update existing or append new
        if let index = assignments.firstIndex(where: { $0.id == assignment.id }) {
            assignments[index] = assignment
        } else {
            assignments.append(assignment)
        }

        try saveAssignments(assignments)
    }

    // MARK: - Load Operations

    /// Load all music assignments
    func loadAssignments() throws -> [MusicAssignment] {
        guard let data = userDefaults.data(forKey: assignmentsKey) else {
            print("No saved assignments found")
            return []
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let assignments = try decoder.decode([MusicAssignment].self, from: data)
            print("Loaded \(assignments.count) music assignments")
            return assignments
        } catch {
            print("Error loading assignments: \(error)")
            throw StorageError.decodingFailed(error)
        }
    }

    /// Load assignment for a specific terminal session
    func loadAssignment(for terminalSessionID: String) throws -> MusicAssignment? {
        let assignments = try loadAssignments()
        return assignments.first(where: { $0.terminalSessionID == terminalSessionID })
    }

    // MARK: - Update Operations

    /// Update an existing assignment
    func updateAssignment(withID id: String, updater: (inout MusicAssignment) -> Void) throws {
        var assignments = try loadAssignments()

        guard let index = assignments.firstIndex(where: { $0.id == id }) else {
            throw StorageError.assignmentNotFound
        }

        updater(&assignments[index])
        try saveAssignments(assignments)
    }

    /// Update assignment for a terminal session
    func updateAssignment(for terminalSessionID: String, youtubeURL: String, videoTitle: String? = nil) throws {
        var assignments = try loadAssignments()

        if let index = assignments.firstIndex(where: { $0.terminalSessionID == terminalSessionID }) {
            // Update existing assignment
            assignments[index].youtubeURL = youtubeURL
            assignments[index].videoTitle = videoTitle
        } else {
            // Create new assignment
            let newAssignment = MusicAssignment(
                terminalSessionID: terminalSessionID,
                youtubeURL: youtubeURL,
                videoTitle: videoTitle
            )
            assignments.append(newAssignment)
        }

        try saveAssignments(assignments)
    }

    // MARK: - Delete Operations

    /// Delete an assignment by ID
    func deleteAssignment(withID id: String) throws {
        var assignments = try loadAssignments()
        assignments.removeAll(where: { $0.id == id })
        try saveAssignments(assignments)
        print("Deleted assignment with ID: \(id)")
    }

    /// Delete assignment for a terminal session
    func deleteAssignment(for terminalSessionID: String) throws {
        var assignments = try loadAssignments()
        assignments.removeAll(where: { $0.terminalSessionID == terminalSessionID })
        try saveAssignments(assignments)
        print("Deleted assignment for terminal: \(terminalSessionID)")
    }

    /// Delete all assignments
    func deleteAllAssignments() {
        userDefaults.removeObject(forKey: assignmentsKey)
        print("Deleted all assignments")
    }

    // MARK: - Utility

    /// Check if an assignment exists for a terminal session
    func hasAssignment(for terminalSessionID: String) -> Bool {
        guard let assignments = try? loadAssignments() else {
            return false
        }
        return assignments.contains(where: { $0.terminalSessionID == terminalSessionID })
    }
}

// MARK: - Storage Errors

enum StorageError: Error, LocalizedError {
    case encodingFailed(Error)
    case decodingFailed(Error)
    case assignmentNotFound

    var errorDescription: String? {
        switch self {
        case .encodingFailed(let error):
            return "Failed to encode data: \(error.localizedDescription)"
        case .decodingFailed(let error):
            return "Failed to decode data: \(error.localizedDescription)"
        case .assignmentNotFound:
            return "Assignment not found"
        }
    }
}
