import Foundation

struct PasteBackTarget: Equatable {
    let pid: pid_t
    let appName: String?
    let hadSelection: Bool

    var actionTitle: String {
        let language = LanguageStore.shared.language
        return L10n.t(hadSelection ? "paste.replace" : "paste.paste", language: language)
    }

    var actionHelp: String {
        let language = LanguageStore.shared.language
        let dest = appName ?? L10n.t("paste.previousApp", language: language)
        return L10n.t(hadSelection ? "paste.replaceHelp" : "paste.pasteHelp", language: language, dest)
    }
}

enum PasteBackAvailability: Equatable {
    case unavailable
    case replace(appName: String?)
    case paste(appName: String?)
}

enum PasteBackResult: Equatable {
    case replacedViaAccessibility
    case replacedViaPaste
    case noTarget
    case emptyText
    case activateFailed
}

protocol PasteBackPerforming {
    func copyToClipboard(_ text: String)
    func replaceSelectionViaAccessibility(_ text: String) -> Bool
    func resignPanel()
    func activateSourceApp(pid: pid_t) -> Bool
    func restoreSelection()
    func sendPasteKeystroke()
}

enum PasteBackAX {
    /// True only when `replacement` landed without leaving `original` glued to it.
    static func didReplaceNotAppend(original: String, replacement: String, valueAfter: String) -> Bool {
        guard !original.isEmpty else { return valueAfter.contains(replacement) }
        if valueAfter.contains(original + replacement) { return false }
        if valueAfter.contains(replacement + original) { return false }
        return valueAfter.contains(replacement)
    }

    static func splice(value: String, range: NSRange, replacement: String) -> String? {
        let ns = value as NSString
        guard range.location >= 0, NSMaxRange(range) <= ns.length else { return nil }
        return ns.replacingCharacters(in: range, with: replacement)
    }

    static func selectionMatchesOriginal(_ selection: String, original: String) -> Bool {
        let a = selection.trimmingCharacters(in: .whitespacesAndNewlines)
            .precomposedStringWithCanonicalMapping
        let b = original.trimmingCharacters(in: .whitespacesAndNewlines)
            .precomposedStringWithCanonicalMapping
        return !a.isEmpty && a == b
    }

    static func graphemeCount(_ text: String) -> Int {
        text.trimmingCharacters(in: .whitespacesAndNewlines).count
    }
}

enum PasteBackService {
    static func availability(resultText: String, target: PasteBackTarget?) -> PasteBackAvailability {
        guard !resultText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .unavailable
        }
        guard let target else { return .unavailable }
        return target.hadSelection
            ? .replace(appName: target.appName)
            : .paste(appName: target.appName)
    }

    static func perform(
        text: String,
        target: PasteBackTarget?,
        using env: PasteBackPerforming
    ) -> PasteBackResult {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .emptyText
        }
        guard let target else { return .noTarget }

        env.copyToClipboard(text)

        if target.hadSelection, env.replaceSelectionViaAccessibility(text) {
            env.resignPanel()
            _ = env.activateSourceApp(pid: target.pid)
            return .replacedViaAccessibility
        }

        env.resignPanel()
        guard env.activateSourceApp(pid: target.pid) else {
            return .activateFailed
        }
        if target.hadSelection {
            env.restoreSelection()
        }
        env.sendPasteKeystroke()
        return .replacedViaPaste
    }
}
