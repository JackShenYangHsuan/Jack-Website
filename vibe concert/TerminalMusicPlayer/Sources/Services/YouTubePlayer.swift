import Foundation
import WebKit
import AVFoundation

/// Manages YouTube playback using WKWebView and YouTube iframe API
class YouTubePlayer: NSObject {
    private var webView: WKWebView?
    private var currentVideoID: String?
    private var isReady: Bool = false
    private var pendingCommands: [(Command)] = []

    private enum Command {
        case play
        case pause
        case stop
        case loadVideo(String)
    }

    override init() {
        super.init()
        setupWebView()
    }

    // MARK: - Setup

    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView?.navigationDelegate = self

        print("YouTubePlayer initialized")
    }

    // MARK: - Public API

    /// Load a YouTube video by URL
    func loadVideo(url: String) {
        guard let videoID = URLValidator.extractVideoID(from: url) else {
            print("Error: Invalid YouTube URL: \(url)")
            return
        }

        currentVideoID = videoID
        loadYouTubePlayer(videoID: videoID)
    }

    /// Start playback
    func play() {
        guard isReady else {
            pendingCommands.append(.play)
            return
        }

        executeJavaScript("player.playVideo();")
        print("Playing video")
    }

    /// Pause playback
    func pause() {
        guard isReady else {
            pendingCommands.append(.pause)
            return
        }

        executeJavaScript("player.pauseVideo();")
        print("Pausing video")
    }

    /// Stop playback and reset
    func stop() {
        guard isReady else {
            pendingCommands.append(.stop)
            return
        }

        executeJavaScript("player.stopVideo();")
        print("Stopping video")
    }

    /// Check if player is currently playing
    func isPlaying(completion: @escaping (Bool) -> Void) {
        guard isReady else {
            completion(false)
            return
        }

        webView?.evaluateJavaScript("player.getPlayerState();") { result, error in
            if let state = result as? Int {
                // YouTube player states: 1 = playing, 2 = paused
                completion(state == 1)
            } else {
                completion(false)
            }
        }
    }

    // MARK: - Private Methods

    private func loadYouTubePlayer(videoID: String) {
        let html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { margin: 0; padding: 0; background-color: #000; }
                #player { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
            </style>
        </head>
        <body>
            <div id="player"></div>
            <script>
                var tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                var player;
                function onYouTubeIframeAPIReady() {
                    player = new YT.Player('player', {
                        height: '100%',
                        width: '100%',
                        videoId: '\(videoID)',
                        playerVars: {
                            'autoplay': 0,
                            'controls': 0,
                            'disablekb': 1,
                            'fs': 0,
                            'modestbranding': 1,
                            'playsinline': 1
                        },
                        events: {
                            'onReady': onPlayerReady,
                            'onStateChange': onPlayerStateChange
                        }
                    });
                }

                function onPlayerReady(event) {
                    window.webkit.messageHandlers.playerReady.postMessage('ready');
                }

                function onPlayerStateChange(event) {
                    window.webkit.messageHandlers.playerStateChange.postMessage(event.data);
                }
            </script>
        </body>
        </html>
        """

        webView?.loadHTMLString(html, baseURL: URL(string: "https://www.youtube.com"))
        isReady = false
    }

    private func executeJavaScript(_ script: String) {
        webView?.evaluateJavaScript(script) { result, error in
            if let error = error {
                print("JavaScript execution error: \(error)")
            }
        }
    }

    private func processPendingCommands() {
        for command in pendingCommands {
            switch command {
            case .play:
                play()
            case .pause:
                pause()
            case .stop:
                stop()
            case .loadVideo(let videoID):
                loadVideo(url: "https://www.youtube.com/watch?v=\(videoID)")
            }
        }
        pendingCommands.removeAll()
    }
}

// MARK: - WKNavigationDelegate

extension YouTubePlayer: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("WebView finished loading")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("WebView failed to load: \(error)")
    }
}

// MARK: - WKScriptMessageHandler

extension YouTubePlayer: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "playerReady" {
            isReady = true
            print("YouTube player is ready")
            processPendingCommands()
        } else if message.name == "playerStateChange" {
            if let state = message.body as? Int {
                handlePlayerStateChange(state: state)
            }
        }
    }

    private func handlePlayerStateChange(state: Int) {
        // YouTube player states:
        // -1 = unstarted, 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = video cued
        switch state {
        case 0:
            print("Video ended")
        case 1:
            print("Video playing")
        case 2:
            print("Video paused")
        default:
            break
        }
    }
}
