import Foundation
import Cocoa

/// Protocol for terminal monitoring delegates
protocol TerminalMonitorDelegate: AnyObject {
    func terminalMonitor(_ monitor: TerminalMonitor, didDetectSessions sessions: [TerminalSession])
    func terminalMonitor(_ monitor: TerminalMonitor, sessionDidChangeStatus session: TerminalSession)
}

/// Monitors terminal sessions and their execution status
class TerminalMonitor {
    weak var delegate: TerminalMonitorDelegate?

    private var sessions: [String: TerminalSession] = [:]
    private var monitoringTimer: Timer?
    private var cpuUsageCache: [pid_t: Double] = [:]
    private let monitoringInterval: TimeInterval = 2.0 // Check every 2 seconds

    // Supported terminal applications
    private let supportedTerminals = ["Terminal", "iTerm2", "iTerm", "Warp", "Alacritty"]

    init() {
        print("TerminalMonitor initialized")
    }

    /// Start monitoring terminal sessions
    func startMonitoring() {
        print("Starting terminal monitoring...")

        // Initial scan
        detectTerminalSessions()

        // Set up periodic monitoring
        monitoringTimer = Timer.scheduledTimer(withTimeInterval: monitoringInterval, repeats: true) { [weak self] _ in
            self?.updateSessionStates()
        }

        print("Terminal monitoring started")
    }

    /// Stop monitoring
    func stopMonitoring() {
        monitoringTimer?.invalidate()
        monitoringTimer = nil
        print("Terminal monitoring stopped")
    }

    /// Detect all running terminal sessions
    private func detectTerminalSessions() {
        let workspace = NSWorkspace.shared
        let runningApps = workspace.runningApplications

        var detectedSessions: [TerminalSession] = []

        for app in runningApps {
            guard let appName = app.localizedName,
                  supportedTerminals.contains(appName),
                  let processID = app.processIdentifier as pid_t? else {
                continue
            }

            // Create or update session for this terminal
            let sessionID = "\(appName)-\(processID)"

            if sessions[sessionID] == nil {
                var session = TerminalSession(
                    id: sessionID,
                    name: "\(appName) Session",
                    processID: processID,
                    applicationName: appName
                )

                // Determine initial status
                session.updateStatus(determineSessionStatus(processID: processID))
                sessions[sessionID] = session
                detectedSessions.append(session)

                print("Detected new terminal session: \(sessionID)")
            }
        }

        // Remove sessions for terminals that are no longer running
        let currentProcessIDs = Set(runningApps.compactMap { $0.processIdentifier })
        sessions = sessions.filter { currentProcessIDs.contains(Int32($0.value.processID)) }

        // Notify delegate
        if !detectedSessions.isEmpty {
            delegate?.terminalMonitor(self, didDetectSessions: Array(sessions.values))
        }
    }

    /// Update status of all monitored sessions
    private func updateSessionStates() {
        detectTerminalSessions() // Refresh session list

        for (sessionID, var session) in sessions {
            let oldStatus = session.status
            let newStatus = determineSessionStatus(processID: session.processID)

            if oldStatus != newStatus {
                session.updateStatus(newStatus)
                sessions[sessionID] = session

                print("Session \(sessionID) status changed: \(oldStatus.rawValue) -> \(newStatus.rawValue)")
                delegate?.terminalMonitor(self, sessionDidChangeStatus: session)
            }
        }
    }

    /// Determine if a terminal session is running or idle based on CPU usage
    private func determineSessionStatus(processID: pid_t) -> TerminalSession.SessionStatus {
        let cpuUsage = getCPUUsage(for: processID)

        // Cache the CPU usage for comparison
        let previousUsage = cpuUsageCache[processID] ?? 0.0
        cpuUsageCache[processID] = cpuUsage

        // Heuristic: If CPU usage is above threshold, consider it running
        // This threshold may need tuning based on testing
        let cpuThreshold = 5.0 // 5% CPU usage

        if cpuUsage > cpuThreshold || previousUsage > cpuThreshold {
            return .running
        } else {
            return .idle
        }
    }

    /// Get CPU usage percentage for a process
    private func getCPUUsage(for processID: pid_t) -> Double {
        var taskInfo = task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<task_basic_info>.size) / 4

        let kr: kern_return_t = withUnsafeMutablePointer(to: &taskInfo) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_,
                         task_flavor_t(TASK_BASIC_INFO),
                         $0,
                         &count)
            }
        }

        guard kr == KERN_SUCCESS else {
            return 0.0
        }

        // Convert to CPU percentage (this is a simplified approach)
        // In production, you'd want to calculate delta between measurements
        let cpuUsage = Double(taskInfo.user_time.seconds + taskInfo.system_time.seconds)

        return cpuUsage
    }

    /// Get all currently monitored sessions
    func getAllSessions() -> [TerminalSession] {
        return Array(sessions.values)
    }

    /// Get a specific session by ID
    func getSession(withID id: String) -> TerminalSession? {
        return sessions[id]
    }
}
