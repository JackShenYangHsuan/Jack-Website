// swift-tools-version:5.7
import PackageDescription

let package = Package(
    name: "TerminalMusicPlayer",
    platforms: [
        .macOS(.v12)
    ],
    targets: [
        .executableTarget(
            name: "TerminalMusicPlayer",
            path: "Sources"
        ),
        .testTarget(
            name: "TerminalMusicPlayerTests",
            dependencies: ["TerminalMusicPlayer"],
            path: "Tests/TerminalMusicPlayerTests"
        )
    ]
)
