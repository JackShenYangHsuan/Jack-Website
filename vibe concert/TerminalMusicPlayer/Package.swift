// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "TerminalMusicPlayer",
    platforms: [
        .macOS(.v13)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "TerminalMusicPlayer",
            dependencies: [],
            path: "Sources"
        )
    ]
)
