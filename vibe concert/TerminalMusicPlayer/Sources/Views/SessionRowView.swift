import SwiftUI

/// Individual session row component in the panel
struct SessionRowView: View {
    let session: TerminalSession
    let assignment: MusicAssignment?
    let onAssignMusic: () -> Void
    let onPlay: () -> Void
    let onPause: () -> Void
    let onStop: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Session header
            HStack {
                // Status indicator
                Circle()
                    .fill(statusColor)
                    .frame(width: 10, height: 10)

                Text(session.name)
                    .font(.system(size: 14, weight: .medium))

                Spacer()

                Text(session.status.rawValue)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusBackgroundColor)
                    .cornerRadius(8)
            }

            // Music assignment info
            if let assignment = assignment {
                HStack {
                    Image(systemName: "music.note")
                        .foregroundColor(.blue)
                        .font(.caption)

                    Text(assignment.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                        .truncationMode(.middle)

                    Spacer()

                    // Playback controls
                    HStack(spacing: 8) {
                        Button(action: onPlay) {
                            Image(systemName: "play.fill")
                                .font(.caption)
                        }
                        .buttonStyle(ControlButtonStyle())

                        Button(action: onPause) {
                            Image(systemName: "pause.fill")
                                .font(.caption)
                        }
                        .buttonStyle(ControlButtonStyle())

                        Button(action: onStop) {
                            Image(systemName: "stop.fill")
                                .font(.caption)
                        }
                        .buttonStyle(ControlButtonStyle())
                    }
                }
            } else {
                // No music assigned
                Button(action: onAssignMusic) {
                    HStack {
                        Image(systemName: "plus.circle")
                        Text("Assign Music")
                            .font(.caption)
                    }
                }
                .buttonStyle(PlainButtonStyle())
                .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(12)
        .onTapGesture {
            if assignment == nil {
                onAssignMusic()
            }
        }
    }

    private var statusColor: Color {
        switch session.status {
        case .running:
            return .green
        case .idle:
            return .red
        case .unknown:
            return .gray
        }
    }

    private var statusBackgroundColor: Color {
        switch session.status {
        case .running:
            return Color.green.opacity(0.1)
        case .idle:
            return Color.red.opacity(0.1)
        case .unknown:
            return Color.gray.opacity(0.1)
        }
    }
}

/// Custom button style for playback controls
struct ControlButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(.primary)
            .padding(6)
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(6)
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.7 : 1.0)
    }
}

// MARK: - Preview

struct SessionRowView_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 16) {
            // Running session with music
            SessionRowView(
                session: TerminalSession(
                    id: "1",
                    name: "Terminal Session",
                    status: .running,
                    processID: 1234,
                    applicationName: "Terminal"
                ),
                assignment: MusicAssignment(
                    terminalSessionID: "1",
                    youtubeURL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    videoTitle: "Focus Music"
                ),
                onAssignMusic: {},
                onPlay: {},
                onPause: {},
                onStop: {}
            )

            // Idle session without music
            SessionRowView(
                session: TerminalSession(
                    id: "2",
                    name: "iTerm2 Session",
                    status: .idle,
                    processID: 5678,
                    applicationName: "iTerm2"
                ),
                assignment: nil,
                onAssignMusic: {},
                onPlay: {},
                onPause: {},
                onStop: {}
            )
        }
        .padding()
        .frame(width: 400)
    }
}
