import Cocoa
import SwiftUI

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    var statusBarController: StatusBarController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Initialize status bar controller
        statusBarController = StatusBarController()

        print("Terminal Music Player started successfully")
    }

    func applicationWillTerminate(_ notification: Notification) {
        print("Terminal Music Player terminating")
    }

    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        return true
    }
}
