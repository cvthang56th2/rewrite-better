import AppKit
import ApplicationServices

/// Remembers the last frontmost app that isn't Rewrite Better, so menu-bar
/// opens can still read selection after our menu steals focus.
@MainActor
final class FrontmostAppTracker {
    static let shared = FrontmostAppTracker()

    private(set) var lastForeignAppPID: pid_t?
    private var observer: NSObjectProtocol?

    private init() {}

    func start() {
        guard observer == nil else { return }
        update(from: NSWorkspace.shared.frontmostApplication)
        observer = NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification,
            object: nil,
            queue: .main
        ) { [weak self] note in
            let app = note.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication
            Task { @MainActor in
                self?.update(from: app)
            }
        }
    }

    private func update(from app: NSRunningApplication?) {
        guard let app, app.processIdentifier != ProcessInfo.processInfo.processIdentifier else { return }
        // Ignore our own helper processes; keep real user apps.
        if app.bundleIdentifier == Bundle.main.bundleIdentifier { return }
        lastForeignAppPID = app.processIdentifier
    }
}

enum TextCaptureService {
    /// Selected text only (Accessibility → Cmd+C probe). Does not read the clipboard.
    @MainActor
    static func capturePreferredText() -> String {
        if let selected = readSelectedText(), !selected.isEmpty {
            return selected
        }
        return ""
    }

    static func copyToClipboard(_ text: String) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)
    }

    static var hasAccessibilityPermission: Bool {
        AXIsProcessTrusted()
    }

    static func openAccessibilitySettings() {
        let urls = [
            "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
            "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Accessibility"
        ]
        for raw in urls {
            if let url = URL(string: raw), NSWorkspace.shared.open(url) {
                return
            }
        }
    }

    // MARK: - Selection

    @MainActor
    private static func readSelectedText() -> String? {
        guard hasAccessibilityPermission else { return nil }

        // 1) Focused UI element (works best with global hotkey while other app is focused)
        if let text = selectedTextFromSystemFocus(), !text.isEmpty {
            return text
        }

        // 2) Last foreign app (menu-bar click often moves focus away)
        if let pid = FrontmostAppTracker.shared.lastForeignAppPID,
           let text = selectedText(inApplicationPID: pid), !text.isEmpty {
            return text
        }

        // 3) Temporary Cmd+C without clearing clipboard first
        if let text = selectedTextViaCopyShortcut(), !text.isEmpty {
            return text
        }

        return nil
    }

    private static func selectedTextFromSystemFocus() -> String? {
        let systemWide = AXUIElementCreateSystemWide()
        return selectedText(fromFocusedElementOf: systemWide)
    }

    private static func selectedText(inApplicationPID pid: pid_t) -> String? {
        let appElement = AXUIElementCreateApplication(pid)
        return selectedText(fromFocusedElementOf: appElement)
    }

    private static func selectedText(fromFocusedElementOf root: AXUIElement) -> String? {
        var focusedRef: CFTypeRef?
        let status = AXUIElementCopyAttributeValue(
            root,
            kAXFocusedUIElementAttribute as CFString,
            &focusedRef
        )
        guard status == .success, let focusedRef else { return nil }
        let focused = focusedRef as! AXUIElement

        var selectedRef: CFTypeRef?
        let selectedStatus = AXUIElementCopyAttributeValue(
            focused,
            kAXSelectedTextAttribute as CFString,
            &selectedRef
        )
        if selectedStatus == .success, let text = selectedRef as? String {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            return trimmed.isEmpty ? nil : trimmed
        }

        // Fallback: some fields expose full value only
        var valueRef: CFTypeRef?
        if AXUIElementCopyAttributeValue(focused, kAXValueAttribute as CFString, &valueRef) == .success,
           let text = valueRef as? String {
            // Only use full value if it's short enough to likely be a selection/field contents
            // Prefer not to dump huge documents — skip if very long without selected text attr.
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty && trimmed.count <= 8000 {
                // Without selected-text attribute we can't know selection vs whole field.
                // Don't use full value — avoid overwriting with entire document.
                return nil
            }
        }
        return nil
    }

    /// Probe selection by synthesizing ⌘C; restore previous clipboard afterward.
    private static func selectedTextViaCopyShortcut() -> String? {
        let pasteboard = NSPasteboard.general
        let previousChangeCount = pasteboard.changeCount
        let previousString = pasteboard.string(forType: .string)

        sendCommandC()

        var copied: String?
        for _ in 0..<15 {
            usleep(20_000)
            if pasteboard.changeCount != previousChangeCount {
                copied = pasteboard.string(forType: .string)
                break
            }
        }

        // Restore prior clipboard so we don't leave the selection on the pasteboard.
        if let previousString {
            pasteboard.clearContents()
            pasteboard.setString(previousString, forType: .string)
        }

        let trimmed = copied?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? nil : trimmed
    }

    private static func sendCommandC() {
        let source = CGEventSource(stateID: .hidSystemState)
        let keyDown = CGEvent(keyboardEventSource: source, virtualKey: 0x08, keyDown: true) // C
        let keyUp = CGEvent(keyboardEventSource: source, virtualKey: 0x08, keyDown: false)
        keyDown?.flags = .maskCommand
        keyUp?.flags = .maskCommand
        keyDown?.post(tap: .cghidEventTap)
        keyUp?.post(tap: .cghidEventTap)
    }
}
