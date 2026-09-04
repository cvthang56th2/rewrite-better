import AppKit
import SwiftUI

/// Owns the floating NSPanel that hosts the SwiftUI panel.
@MainActor
final class PanelController: ObservableObject {
    static let shared = PanelController()

    @Published var inputText = ""
    @Published var isPresented = false
    @Published var showSettings = false
    @Published var needsAccessibility = false

    private var panel: NSPanel?
    private var settingsWindow: NSWindow?

    private init() {}

    func setup() {
        FrontmostAppTracker.shared.start()
        HotkeyService.shared.onHotkey = { [weak self] in
            Task { @MainActor in
                self?.toggleFromHotkey()
            }
        }
        HotkeyService.shared.register()
    }

    func toggleFromHotkey() {
        if isPresented {
            close()
            return
        }
        openWithCapturedText()
    }

    func openFromMenu() {
        openWithCapturedText()
    }

    func openWithCapturedText() {
        // Capture while the previous app still owns focus whenever possible.
        needsAccessibility = !TextCaptureService.hasAccessibilityPermission
        inputText = TextCaptureService.capturePreferredText()
        show()
    }

    func openEmpty() {
        needsAccessibility = !TextCaptureService.hasAccessibilityPermission
        inputText = ""
        show()
    }

    func refreshAccessibilityStatus() {
        needsAccessibility = !TextCaptureService.hasAccessibilityPermission
    }

    func show() {
        if panel == nil {
            createPanel()
        }
        guard let panel else { return }

        let preferred = NSSize(width: 780, height: 540)
        var frame = panel.frame
        if frame.width < preferred.width || frame.height < preferred.height {
            frame.size = preferred
        }

        if let screen = NSScreen.main {
            let visible = screen.visibleFrame
            frame.size.width = min(frame.size.width, visible.width - 40)
            frame.size.height = min(frame.size.height, visible.height - 40)
            frame.origin.x = visible.midX - frame.width / 2
            frame.origin.y = visible.midY - frame.height / 2
        }
        panel.setFrame(frame, display: true)

        NSApp.activate(ignoringOtherApps: true)
        panel.makeKeyAndOrderFront(nil)
        isPresented = true
    }

    func close() {
        panel?.orderOut(nil)
        isPresented = false
    }

    func openSettings() {
        if settingsWindow == nil {
            let view = SettingsView()
            let hosting = NSHostingController(rootView: view)
            let window = NSWindow(contentViewController: hosting)
            window.title = "Rewrite Better Settings"
            window.styleMask = [.titled, .closable]
            window.setContentSize(NSSize(width: 440, height: 360))
            window.center()
            settingsWindow = window
        }
        NSApp.activate(ignoringOtherApps: true)
        settingsWindow?.makeKeyAndOrderFront(nil)
    }

    private func createPanel() {
        let panelView = PanelView()
            .environmentObject(self)

        let hosting = NSHostingController(rootView: panelView)
        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 780, height: 540),
            styleMask: [.titled, .closable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        panel.contentViewController = hosting
        panel.title = "Rewrite Better"
        panel.isFloatingPanel = true
        panel.level = .floating
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        panel.minSize = NSSize(width: 720, height: 440)
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        self.panel = panel
    }
}
