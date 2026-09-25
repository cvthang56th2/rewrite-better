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
    @Published var pasteBackTarget: PasteBackTarget?

    private var panel: NSPanel?
    private var welcomeWindow: NSWindow?
    private var privacyWindow: NSWindow?
    private var pasteBackElement: AXUIElement?
    private var pasteBackRange: CFRange?
    private var pasteBackOriginal = ""

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
        showSettings = false
        // Capture while the previous app still owns focus whenever possible.
        needsAccessibility = !TextCaptureService.hasAccessibilityPermission
        let capture = TextCaptureService.captureSelection()
        rememberPasteBackTarget(capture: capture)
        inputText = capture.text
        show()
    }

    func openEmpty() {
        showSettings = false
        needsAccessibility = !TextCaptureService.hasAccessibilityPermission
        let source = TextCaptureService.currentSourceApp()
        let element = source.flatMap { TextCaptureService.focusedTextElement(inAppPID: $0.pid) }
        rememberPasteBackTarget(
            capture: SelectionCapture(text: "", focusedElement: element),
            forceNoSelection: true
        )
        inputText = ""
        show()
    }

    func pasteBack(text: String) -> PasteBackResult {
        let env = SystemPasteBackEnvironment(
            focusedElement: pasteBackElement,
            selectedRange: pasteBackRange,
            original: pasteBackOriginal,
            onResign: { [weak self] in self?.close() }
        )
        return PasteBackService.perform(text: text, target: pasteBackTarget, using: env)
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

    private func rememberPasteBackTarget(capture: SelectionCapture, forceNoSelection: Bool = false) {
        pasteBackElement = capture.focusedElement
        pasteBackRange = capture.selectedRange
        pasteBackOriginal = capture.rawSelectedText.isEmpty ? capture.text : capture.rawSelectedText
        let hadSelection = !forceNoSelection
            && !capture.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        pasteBackTarget = TextCaptureService.currentSourceApp().map { source in
            PasteBackTarget(pid: source.pid, appName: source.name, hadSelection: hadSelection)
        }
    }

    func openSettings() {
        showSettings = true
        if isPresented, let panel {
            NSApp.activate(ignoringOtherApps: true)
            panel.makeKeyAndOrderFront(nil)
            return
        }
        show()
    }

    func closeSettings() {
        showSettings = false
    }

    func openWelcome() {
        if welcomeWindow == nil {
            let view = WelcomeView(
                onAddKey: { [weak self] in
                    self?.welcomeWindow?.orderOut(nil)
                    self?.openSettings()
                },
                onPrivacy: { [weak self] in self?.openPrivacy() },
                onDone: { [weak self] in self?.welcomeWindow?.orderOut(nil) }
            )
            let hosting = NSHostingController(rootView: view)
            let window = NSWindow(contentViewController: hosting)
            window.title = LanguageStore.shared.t("onboarding.windowTitle")
            window.styleMask = [.titled, .closable]
            window.setContentSize(NSSize(width: 540, height: 460))
            window.isReleasedWhenClosed = false
            window.center()
            welcomeWindow = window
        }
        welcomeWindow?.title = LanguageStore.shared.t("onboarding.windowTitle")
        NSApp.activate(ignoringOtherApps: true)
        welcomeWindow?.makeKeyAndOrderFront(nil)
    }

    func openPrivacy() {
        if privacyWindow == nil {
            let hosting = NSHostingController(rootView: PrivacyView())
            let window = NSWindow(contentViewController: hosting)
            window.title = LanguageStore.shared.t("privacy.windowTitle")
            window.styleMask = [.titled, .closable, .resizable]
            window.setContentSize(NSSize(width: 560, height: 420))
            window.minSize = NSSize(width: 480, height: 320)
            window.isReleasedWhenClosed = false
            window.center()
            privacyWindow = window
        }
        privacyWindow?.title = LanguageStore.shared.t("privacy.windowTitle")
        NSApp.activate(ignoringOtherApps: true)
        privacyWindow?.makeKeyAndOrderFront(nil)
    }

    private func createPanel() {
        let panelView = PanelView()
            .environmentObject(self)

        let hosting = NSHostingController(rootView: panelView)
        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 780, height: 540),
            styleMask: [.titled, .closable, .resizable],
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

@MainActor
final class SystemPasteBackEnvironment: PasteBackPerforming {
    let focusedElement: AXUIElement?
    let selectedRange: CFRange?
    let original: String
    let pasteDelay: TimeInterval
    let onResign: () -> Void

    init(
        focusedElement: AXUIElement?,
        selectedRange: CFRange?,
        original: String,
        pasteDelay: TimeInterval = 0.2,
        onResign: @escaping () -> Void
    ) {
        self.focusedElement = focusedElement
        self.selectedRange = selectedRange
        self.original = original
        self.pasteDelay = pasteDelay
        self.onResign = onResign
    }

    func copyToClipboard(_ text: String) {
        TextCaptureService.copyToClipboard(text)
    }

    func replaceSelectionViaAccessibility(_ text: String) -> Bool {
        TextCaptureService.replaceSelectedText(
            text,
            in: focusedElement,
            range: selectedRange,
            original: original.isEmpty ? text : original
        )
    }

    func resignPanel() {
        onResign()
    }

    func activateSourceApp(pid: pid_t) -> Bool {
        guard let app = NSRunningApplication(processIdentifier: pid), !app.isTerminated else {
            return false
        }
        return app.activate(options: [.activateIgnoringOtherApps])
    }

    func restoreSelection() {
        _ = TextCaptureService.restoreSelectedRange(selectedRange, in: focusedElement, original: original)
    }

    func sendPasteKeystroke() {
        let element = focusedElement
        let range = selectedRange
        let original = original
        DispatchQueue.main.asyncAfter(deadline: .now() + pasteDelay) {
            _ = TextCaptureService.restoreSelectedRange(range, in: element, original: original)
            TextCaptureService.sendCommandV()
        }
    }
}
