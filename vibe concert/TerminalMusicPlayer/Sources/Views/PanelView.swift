import SwiftUI

/// Main panel view displayed when clicking the menu bar icon
struct PanelView: View {
    @ObservedObject var viewModel: PanelViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Terminal Music Player")
                    .font(.headline)
                    .foregroundColor(.primary)

                Spacer()

                Button(action: {
                    viewModel.showSettings()
                }) {
                    Image(systemName: "gearshape")
                        .foregroundColor(.secondary)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))

            Divider()

            // Session List
            if viewModel.sessions.isEmpty {
                // Empty state
                VStack(spacing: 16) {
                    Image(systemName: "terminal")
                        .font(.system(size: 48))
                        .foregroundColor(.secondary)

                    Text("No terminals detected")
                        .font(.title3)
                        .foregroundColor(.secondary)

                    Text("Open a terminal window to get started")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding()
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(viewModel.sessions) { session in
                            SessionRowView(
                                session: session,
                                assignment: viewModel.getAssignment(for: session.id),
                                onAssignMusic: {
                                    viewModel.selectedSessionID = session.id
                                    viewModel.showMusicAssignmentModal = true
                                },
                                onPlay: { viewModel.playMusic(for: session.id) },
                                onPause: { viewModel.pauseMusic(for: session.id) },
                                onStop: { viewModel.stopMusic(for: session.id) }
                            )
                        }
                    }
                    .padding()
                }
            }
        }
        .frame(width: 400, height: 500)
        .sheet(isPresented: $viewModel.showMusicAssignmentModal) {
            if let sessionID = viewModel.selectedSessionID {
                MusicAssignmentModal(
                    viewModel: viewModel,
                    sessionID: sessionID,
                    isPresented: $viewModel.showMusicAssignmentModal
                )
            }
        }
    }
}

/// ViewModel for PanelView
class PanelViewModel: ObservableObject {
    @Published var sessions: [TerminalSession] = []
    @Published var assignments: [MusicAssignment] = []
    @Published var showMusicAssignmentModal: Bool = false
    @Published var selectedSessionID: String?

    private let terminalMonitor: TerminalMonitor
    private let playbackController: PlaybackController

    init(terminalMonitor: TerminalMonitor, playbackController: PlaybackController) {
        self.terminalMonitor = terminalMonitor
        self.playbackController = playbackController
        loadSessions()
        loadAssignments()
    }

    func loadSessions() {
        sessions = terminalMonitor.getAllSessions()
    }

    func loadAssignments() {
        assignments = playbackController.getAllAssignments()
    }

    func getAssignment(for sessionID: String) -> MusicAssignment? {
        return assignments.first(where: { $0.terminalSessionID == sessionID })
    }

    func assignMusic(to sessionID: String, youtubeURL: String) {
        playbackController.assignMusic(to: sessionID, youtubeURL: youtubeURL)
        loadAssignments()
    }

    func playMusic(for sessionID: String) {
        playbackController.play(for: sessionID)
    }

    func pauseMusic(for sessionID: String) {
        playbackController.pause(for: sessionID)
    }

    func stopMusic(for sessionID: String) {
        playbackController.stop(for: sessionID)
    }

    func showSettings() {
        // Placeholder for settings functionality
        print("Settings clicked")
    }

    func refreshSessions() {
        loadSessions()
        loadAssignments()
    }
}
