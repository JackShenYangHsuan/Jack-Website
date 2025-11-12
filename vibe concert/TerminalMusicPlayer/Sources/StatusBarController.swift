import Cocoa
import SwiftUI

class StatusBarController {
    private var statusBar: NSStatusBar
    private var statusItem: NSStatusItem
    private var popover: NSPopover
    private var terminalMonitor: TerminalMonitor
    private var playbackController: PlaybackController
    private var panelViewModel: PanelViewModel

    init() {
        // Create status bar item
        statusBar = NSStatusBar.system
        statusItem = statusBar.statusItem(withLength: NSStatusItem.variableLength)

        // Initialize monitoring and playback
        terminalMonitor = TerminalMonitor()
        playbackController = PlaybackController(terminalMonitor: terminalMonitor)
        panelViewModel = PanelViewModel(terminalMonitor: terminalMonitor, playbackController: playbackController)

        // Configure status bar button
        if let statusBarButton = statusItem.button {
            statusBarButton.image = NSImage(systemSymbolName: "music.note", accessibilityDescription: "Terminal Music Player")
            statusBarButton.action = #selector(togglePopover)
            statusBarButton.target = self
        }

        // Create popover
        popover = NSPopover()
        popover.contentSize = NSSize(width: 400, height: 500)
        popover.behavior = .transient

        // Set initial status color (red = all idle)
        updateStatusColor(.red)

        // Start monitoring terminals
        terminalMonitor.startMonitoring()

        // Set up periodic UI updates
        Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
            self?.updateStatus()
            self?.panelViewModel.refreshSessions()
        }

        print("Status bar controller initialized")
    }

    @objc func togglePopover() {
        if let button = statusItem.button {
            if popover.isShown {
                popover.performClose(nil)
            } else {
                // Refresh sessions before showing
                panelViewModel.refreshSessions()

                // Create panel view
                let contentView = NSHostingController(rootView: PanelView(viewModel: panelViewModel))
                popover.contentViewController = contentView
                popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            }
        }
    }

    private func updateStatus() {
        let sessions = terminalMonitor.getAllSessions()

        // Determine aggregate status for color coding
        let runningSessions = sessions.filter { $0.status == .running }.count
        let idleSessions = sessions.filter { $0.status == .idle }.count
        let totalSessions = sessions.count

        if totalSessions == 0 {
            // No terminals
            updateStatusColor(.gray)
        } else if runningSessions == totalSessions {
            // All running (green)
            updateStatusColor(.green)
        } else if idleSessions == totalSessions {
            // All idle (red)
            updateStatusColor(.red)
        } else {
            // Mixed (yellow)
            updateStatusColor(.orange)
        }
    }

    func updateStatusColor(_ color: NSColor) {
        if let button = statusItem.button {
            // Update button appearance based on status
            button.contentTintColor = color
        }
    }
}
