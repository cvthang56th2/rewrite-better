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

struct SelectionCapture {
    var text: String
    var focusedElement: AXUIElement?
    var selectedRange: CFRange?
    var rawSelectedText: String = ""
}

enum TextCaptureService {
    /// Selection plus the focused AX element, so paste-back can replace in-place.
    @MainActor
    static func captureSelection() -> SelectionCapture {
        guard hasAccessibilityPermission else {
            return SelectionCapture(text: "", focusedElement: nil)
        }

        if let captured = readSelectedTextWithElement() {
            return SelectionCapture(
                text: captured.text,
                focusedElement: captured.element,
                selectedRange: captured.range,
                rawSelectedText: captured.raw
            )
        }

        return SelectionCapture(text: "", focusedElement: focusedTextElement())
    }

    @MainActor
    static func currentSourceApp() -> (pid: pid_t, name: String?)? {
        let selfPID = ProcessInfo.processInfo.processIdentifier
        let selfBundle = Bundle.main.bundleIdentifier

        if let app = NSWorkspace.shared.frontmostApplication,
           app.processIdentifier != selfPID,
           app.bundleIdentifier != selfBundle {
            return (app.processIdentifier, app.localizedName)
        }

        guard let pid = FrontmostAppTracker.shared.lastForeignAppPID else { return nil }
        let app = NSRunningApplication(processIdentifier: pid)
        if let app, app.isTerminated { return nil }
        return (pid, app?.localizedName)
    }

    static func replaceSelectedText(
        _ text: String,
        in element: AXUIElement?,
        range: CFRange?,
        original: String
    ) -> Bool {
        guard let element else { return false }

        if let resolved = resolvedRange(in: element, preferred: range, original: original) {
            let nsRange = NSRange(location: resolved.location, length: resolved.length)
            if let value = stringValue(of: element),
               let spliced = PasteBackAX.splice(value: value, range: nsRange, replacement: text),
               setStringValue(spliced, of: element),
               let after = stringValue(of: element),
               PasteBackAX.didReplaceNotAppend(original: original, replacement: text, valueAfter: after) {
                return true
            }

            // Selection often collapses when our panel takes focus. Put it back first.
            if setSelectedTextRange(resolved, of: element) {
                let error = AXUIElementSetAttributeValue(
                    element,
                    kAXSelectedTextAttribute as CFString,
                    text as CFTypeRef
                )
                if error == .success, let after = stringValue(of: element) {
                    return PasteBackAX.didReplaceNotAppend(
                        original: original,
                        replacement: text,
                        valueAfter: after
                    )
                }
            }
        }

        return false
    }

    static func restoreSelectedRange(_ range: CFRange?, in element: AXUIElement?, original: String = "") -> Bool {
        guard let element else { return false }
        let resolved = resolvedRange(in: element, preferred: range, original: original) ?? range
        guard let resolved else { return false }
        return setSelectedTextRange(resolved, of: element)
    }

    static func sendCommandV() {
        sendCommandKey(0x09)
    }

    @MainActor
    static func focusedTextElement() -> AXUIElement? {
        guard hasAccessibilityPermission else { return nil }
        if let element = focusedElement(of: AXUIElementCreateSystemWide()) {
            return element
        }
        if let pid = FrontmostAppTracker.shared.lastForeignAppPID {
            return focusedTextElement(inAppPID: pid)
        }
        return nil
    }

    static func focusedTextElement(inAppPID pid: pid_t) -> AXUIElement? {
        guard hasAccessibilityPermission else { return nil }
        return focusedElement(of: AXUIElementCreateApplication(pid))
    }

    static func copyToClipboard(_ text: String) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)
    }

    static var hasAccessibilityPermission: Bool {
        AXIsProcessTrusted()
    }

    /// Shows the system Accessibility prompt when the app is not yet trusted.
    @discardableResult
    static func promptAccessibilityIfNeeded() -> Bool {
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
        return AXIsProcessTrustedWithOptions(options)
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
    private static func readSelectedTextWithElement() -> (text: String, raw: String, element: AXUIElement?, range: CFRange?)? {
        if let result = selectedTextAndElement(fromFocusedElementOf: AXUIElementCreateSystemWide()),
           !result.text.isEmpty {
            return result
        }

        if let pid = FrontmostAppTracker.shared.lastForeignAppPID,
           let result = selectedTextAndElement(fromFocusedElementOf: AXUIElementCreateApplication(pid)),
           !result.text.isEmpty {
            return result
        }

        if let text = selectedTextViaCopyShortcut(), !text.isEmpty {
            let element = focusedTextElement()
            return (text, text, element, element.flatMap { selectedTextRange(of: $0) })
        }

        return nil
    }

    private static func focusedElement(of root: AXUIElement) -> AXUIElement? {
        var focusedRef: CFTypeRef?
        let status = AXUIElementCopyAttributeValue(
            root,
            kAXFocusedUIElementAttribute as CFString,
            &focusedRef
        )
        guard status == .success, let focusedRef else { return nil }
        return (focusedRef as! AXUIElement)
    }

    private static func selectedTextAndElement(fromFocusedElementOf root: AXUIElement) -> (text: String, raw: String, element: AXUIElement?, range: CFRange?)? {
        guard let focused = focusedElement(of: root) else { return nil }

        var selectedRef: CFTypeRef?
        let selectedStatus = AXUIElementCopyAttributeValue(
            focused,
            kAXSelectedTextAttribute as CFString,
            &selectedRef
        )
        if selectedStatus == .success, let text = selectedRef as? String {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty { return nil }
            return (trimmed, text, focused, selectedTextRange(of: focused))
        }

        return nil
    }

    private static func resolvedRange(in element: AXUIElement, preferred: CFRange?, original: String) -> CFRange? {
        if let preferred, let value = stringValue(of: element) {
            let nsRange = NSRange(location: preferred.location, length: preferred.length)
            let ns = value as NSString
            if nsRange.location >= 0, NSMaxRange(nsRange) <= ns.length {
                let slice = ns.substring(with: nsRange)
                let trimmedSlice = slice.trimmingCharacters(in: .whitespacesAndNewlines)
                let trimmedOriginal = original.trimmingCharacters(in: .whitespacesAndNewlines)
                if slice == original || trimmedSlice == trimmedOriginal {
                    return preferred
                }
            }
        }

        guard !original.isEmpty, let value = stringValue(of: element) else { return preferred }
        let ns = value as NSString
        let first = ns.range(of: original)
        guard first.location != NSNotFound else { return preferred }
        let last = ns.range(of: original, options: .backwards)
        guard first == last else { return preferred }
        return CFRange(location: first.location, length: first.length)
    }

    private static func selectedTextRange(of element: AXUIElement) -> CFRange? {
        var ref: CFTypeRef?
        guard AXUIElementCopyAttributeValue(
            element,
            kAXSelectedTextRangeAttribute as CFString,
            &ref
        ) == .success, let ref else { return nil }
        var range = CFRange()
        guard AXValueGetValue(ref as! AXValue, .cfRange, &range), range.location >= 0, range.length > 0 else {
            return nil
        }
        return range
    }

    private static func setSelectedTextRange(_ range: CFRange, of element: AXUIElement) -> Bool {
        var range = range
        guard let value = AXValueCreate(.cfRange, &range) else { return false }
        return AXUIElementSetAttributeValue(
            element,
            kAXSelectedTextRangeAttribute as CFString,
            value
        ) == .success
    }

    private static func stringValue(of element: AXUIElement) -> String? {
        var ref: CFTypeRef?
        guard AXUIElementCopyAttributeValue(
            element,
            kAXValueAttribute as CFString,
            &ref
        ) == .success else { return nil }
        return ref as? String
    }

    private static func setStringValue(_ text: String, of element: AXUIElement) -> Bool {
        AXUIElementSetAttributeValue(
            element,
            kAXValueAttribute as CFString,
            text as CFTypeRef
        ) == .success
    }

    /// Probe selection by synthesizing ⌘C; restore previous clipboard afterward.
    private static func selectedTextViaCopyShortcut() -> String? {
        let pasteboard = NSPasteboard.general
        let previousChangeCount = pasteboard.changeCount
        let previousString = pasteboard.string(forType: .string)

        sendCommandKey(0x08)

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

    private static func sendCommandKey(_ virtualKey: CGKeyCode) {
        let source = CGEventSource(stateID: .hidSystemState)
        let keyDown = CGEvent(keyboardEventSource: source, virtualKey: virtualKey, keyDown: true)
        let keyUp = CGEvent(keyboardEventSource: source, virtualKey: virtualKey, keyDown: false)
        keyDown?.flags = .maskCommand
        keyUp?.flags = .maskCommand
        keyDown?.post(tap: .cghidEventTap)
        keyUp?.post(tap: .cghidEventTap)
    }
}
