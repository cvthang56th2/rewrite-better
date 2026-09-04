import AppKit
import SwiftUI

/// Owns the floating NSPanel that hosts the SwiftUI panel.
@MainActor
final class PanelController: ObservableObject {
    static let shared = PanelController()

    @Published var inputText = ""
    @Published var isPresented = false
    @Published var showSettings = false

    private var panel: NSPanel?
    private var settingsWindow: NSWindow?

    private init() {}

    func setup() {
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
        if !TextCaptureService.hasAccessibilityPermission {
            TextCaptureService.requestAccessibilityPermission()
        }
        let text = TextCaptureService.capturePreferredText()
        inputText = text
        show()
    }

    func openEmpty() {
        inputText = ""
        show()
    }

    func show() {
        if panel == nil {
            createPanel()
        }
        guard let panel else { return }

        if let screen = NSScreen.main {
            let size = panel.frame.size
            let x = screen.visibleFrame.midX - size.width / 2
            let y = screen.visibleFrame.midY - size.height / 2
            panel.setFrameOrigin(NSPoint(x: x, y: y))
        }

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
            window.setContentSize(NSSize(width: 420, height: 280))
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
            contentRect: NSRect(x: 0, y: 0, width: 420, height: 560),
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
        panel.minSize = NSSize(width: 360, height: 420)
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        self.panel = panel
    }
}
