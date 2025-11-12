import SwiftUI

/// Modal for assigning YouTube music to a terminal session
struct MusicAssignmentModal: View {
    @ObservedObject var viewModel: PanelViewModel
    let sessionID: String
    @Binding var isPresented: Bool

    @State private var youtubeURL: String = ""
    @State private var showError: Bool = false
    @State private var errorMessage: String = ""

    var body: some View {
        VStack(spacing: 20) {
            // Title
            Text("Assign Music")
                .font(.title2)
                .fontWeight(.semibold)

            // Description
            Text("Paste a YouTube URL to play when this terminal is running")
                .font(.callout)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            // URL Input
            VStack(alignment: .leading, spacing: 8) {
                Text("YouTube URL")
                    .font(.caption)
                    .foregroundColor(.secondary)

                TextField("https://www.youtube.com/watch?v=...", text: $youtubeURL)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .onSubmit {
                        assignMusic()
                    }
            }

            // Error message
            if showError {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(8)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
            }

            // Example formats
            VStack(alignment: .leading, spacing: 4) {
                Text("Supported formats:")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text("• youtube.com/watch?v=VIDEO_ID")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text("• youtu.be/VIDEO_ID")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(8)

            Spacer()

            // Buttons
            HStack(spacing: 12) {
                Button("Cancel") {
                    isPresented = false
                }
                .buttonStyle(SecondaryButtonStyle())

                Button("Save") {
                    assignMusic()
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(youtubeURL.isEmpty)
            }
        }
        .padding(24)
        .frame(width: 400, height: 400)
        .onAppear {
            // Pre-fill with existing assignment if any
            if let assignment = viewModel.getAssignment(for: sessionID) {
                youtubeURL = assignment.youtubeURL
            }
        }
    }

    private func assignMusic() {
        // Validate URL
        guard !youtubeURL.trimmingCharacters(in: .whitespaces).isEmpty else {
            showError(message: "Please enter a YouTube URL")
            return
        }

        guard URLValidator.isValidYouTubeURL(youtubeURL) else {
            showError(message: "Invalid YouTube URL. Please check the format.")
            return
        }

        // Assign music
        viewModel.assignMusic(to: sessionID, youtubeURL: youtubeURL)

        // Close modal
        isPresented = false
    }

    private func showError(message: String) {
        errorMessage = message
        showError = true

        // Auto-hide error after 3 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            showError = false
        }
    }
}

// MARK: - Button Styles

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(Color.blue)
            .cornerRadius(8)
            .opacity(configuration.isPressed ? 0.8 : 1.0)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(.primary)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.8 : 1.0)
    }
}

// MARK: - Preview

struct MusicAssignmentModal_Previews: PreviewProvider {
    static var previews: some View {
        MusicAssignmentModal(
            viewModel: PanelViewModel(
                terminalMonitor: TerminalMonitor(),
                playbackController: PlaybackController(terminalMonitor: TerminalMonitor())
            ),
            sessionID: "test-session",
            isPresented: .constant(true)
        )
    }
}
