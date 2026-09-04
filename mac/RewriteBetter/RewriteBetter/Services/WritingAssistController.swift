import Foundation

@MainActor
final class WritingAssistController: ObservableObject {
    @Published var ghostText = ""
    @Published var issues: [WritingIssue] = []
    @Published var isSuggesting = false
    @Published var isChecking = false
    @Published var assistEnabled = true

    private let client = GroqClient()
    private var suggestTask: Task<Void, Never>?
    private var checkTask: Task<Void, Never>?
    private var lastSuggestedFor = ""

    func textDidChange(_ text: String, caretAtEnd: Bool) {
        ghostText = ""
        guard assistEnabled, caretAtEnd else {
            suggestTask?.cancel()
            return
        }
        guard text.trimmingCharacters(in: .whitespacesAndNewlines).count >= 3 else {
            suggestTask?.cancel()
            return
        }

        suggestTask?.cancel()
        suggestTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 500_000_000)
            guard !Task.isCancelled else { return }
            await self?.fetchSuggestion(for: text)
        }

        checkTask?.cancel()
        checkTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 1_600_000_000)
            guard !Task.isCancelled else { return }
            await self?.fetchIssues(for: text)
        }
    }

    func dismissGhost() {
        ghostText = ""
    }

    func apply(issue: WritingIssue, to text: inout String) {
        guard let range = text.range(of: issue.original) else { return }
        text.replaceSubrange(range, with: issue.replacement)
        issues.removeAll { $0.id == issue.id }
        ghostText = ""
        textDidChange(text, caretAtEnd: true)
    }

    func checkNow(_ text: String) async {
        checkTask?.cancel()
        await fetchIssues(for: text)
    }

    private func fetchSuggestion(for text: String) async {
        guard let apiKey = SettingsStore.shared.apiKey, !apiKey.isEmpty else { return }
        guard text != lastSuggestedFor else { return }

        isSuggesting = true
        defer { isSuggesting = false }

        do {
            let prompt = WritingAssistPrompts.autocomplete(prefix: text)
            let raw = try await client.complete(
                prompt: prompt,
                apiKey: apiKey,
                temperature: 0.4,
                maxTokens: 120
            )
            guard !Task.isCancelled else { return }
            let cleaned = sanitizeSuggestion(raw, prefix: text)
            guard !cleaned.isEmpty else {
                ghostText = ""
                return
            }
            lastSuggestedFor = text
            ghostText = cleaned
        } catch {
            if !Task.isCancelled {
                ghostText = ""
            }
        }
    }

    private func fetchIssues(for text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 12 else {
            issues = []
            return
        }
        guard let apiKey = SettingsStore.shared.apiKey, !apiKey.isEmpty else { return }

        isChecking = true
        defer { isChecking = false }

        do {
            let prompt = WritingAssistPrompts.grammarCheck(text: text)
            let raw = try await client.complete(
                prompt: prompt,
                apiKey: apiKey,
                temperature: 0.2,
                maxTokens: 700
            )
            guard !Task.isCancelled else { return }
            issues = parseIssues(from: raw, in: text)
        } catch {
            if !Task.isCancelled {
                // Keep prior issues on transient failure
            }
        }
    }

    private func sanitizeSuggestion(_ raw: String, prefix: String) -> String {
        var s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("```") {
            s = s.replacingOccurrences(of: "```", with: "").trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if let first = s.first, first == "\"" || first == "'" || first == "“" {
            s.removeFirst()
        }
        if let last = s.last, last == "\"" || last == "'" || last == "”" {
            s.removeLast()
        }
        // Don't repeat prefix
        if s.hasPrefix(prefix) {
            s = String(s.dropFirst(prefix.count))
        }
        // Ensure we don't start mid-word awkwardly without space when needed
        if let last = prefix.last, last.isLetter || last.isNumber,
           let first = s.first, first.isLetter || first.isNumber {
            // Mid-word completion is OK (e.g. "hel" + "lo")
        } else if let last = prefix.last, last.isLetter,
                  let first = s.first, first.isLetter,
                  !prefix.hasSuffix(" ") && !s.hasPrefix(" ") && !s.hasPrefix(",") && !s.hasPrefix(".") {
            // leave as-is
        }
        return s
    }

    private func parseIssues(from raw: String, in text: String) -> [WritingIssue] {
        let jsonString: String
        if let start = raw.firstIndex(of: "{"), let end = raw.lastIndex(of: "}") {
            jsonString = String(raw[start...end])
        } else {
            jsonString = raw
        }
        guard let data = jsonString.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let arr = obj["issues"] as? [[String: Any]] else {
            return []
        }

        return arr.compactMap { item in
            guard let original = item["original"] as? String,
                  let replacement = item["replacement"] as? String,
                  !original.isEmpty,
                  text.contains(original) else { return nil }
            let kindRaw = (item["kind"] as? String)?.lowercased() ?? "grammar"
            let kind = WritingIssue.Kind(rawValue: kindRaw) ?? .grammar
            let message = (item["message"] as? String) ?? kind.rawValue
            return WritingIssue(kind: kind, message: message, original: original, replacement: replacement)
        }
    }
}
