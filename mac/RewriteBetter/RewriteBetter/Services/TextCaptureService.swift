import AppKit
import ApplicationServices

enum TextCaptureService {
    /// Prefer current selection (via temporary Cmd+C); fall back to existing clipboard.
    static func capturePreferredText() -> String {
        let pasteboard = NSPasteboard.general
        let previous = pasteboard.string(forType: .string)

        pasteboard.clearContents()
        usleep(30_000)
        sendCommandC()
        usleep(120_000)

        let selected = pasteboard.string(forType: .string)?.trimmingCharacters(in: .whitespacesAndNewlines)

        if let selected, !selected.isEmpty {
            // Restore previous clipboard; keep selection only as panel input.
            pasteboard.clearContents()
            if let previous {
                pasteboard.setString(previous, forType: .string)
            }
            return selected
        }

        pasteboard.clearContents()
        if let previous {
            pasteboard.setString(previous, forType: .string)
            return previous.trimmingCharacters(in: .whitespacesAndNewlines)
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

    static func requestAccessibilityPermission() {
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
        AXIsProcessTrustedWithOptions(options)
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
