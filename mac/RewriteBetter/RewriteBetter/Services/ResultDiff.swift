import Foundation

enum DiffOp: Equatable {
    case equal(String)
    case insert(String)
    case delete(String)

    var text: String {
        switch self {
        case .equal(let value), .insert(let value), .delete(let value):
            return value
        }
    }

    var isChange: Bool {
        switch self {
        case .equal: return false
        case .insert, .delete: return !text.isEmpty
        }
    }
}

enum ResultDiff {
    static func parseVariants(_ raw: String) -> [String] {
        if let object = extractJSON(raw),
           let variants = object["variants"] as? [Any] {
            return uniqueTrimmed(variants.compactMap { $0 as? String })
        }
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        return text.isEmpty ? [] : uniqueTrimmed([text])
    }

    static func hasVisibleDiff(_ parts: [DiffOp]) -> Bool {
        parts.contains { $0.isChange }
    }

    static func diffWords(original: String, next: String) -> [DiffOp] {
        let a = tokenize(original)
        let b = tokenize(next)
        if a.isEmpty && b.isEmpty { return [] }
        if a.joined() == b.joined() {
            return [.equal(a.joined())]
        }

        let n = a.count
        let m = b.count
        if n * m > 40_000 {
            var parts: [DiffOp] = []
            if !original.isEmpty { parts.append(.delete(original)) }
            if !next.isEmpty { parts.append(.insert(next)) }
            return parts
        }

        var dp = Array(repeating: Array(repeating: UInt16(0), count: m + 1), count: n + 1)
        if n > 0 && m > 0 {
            for i in 0..<n {
                for j in 0..<m {
                    dp[i + 1][j + 1] = a[i] == b[j]
                        ? dp[i][j] + 1
                        : max(dp[i + 1][j], dp[i][j + 1])
                }
            }
        }

        var rev: [DiffOp] = []
        var i = n
        var j = m
        while i > 0 && j > 0 {
            if a[i - 1] == b[j - 1] {
                rev.append(.equal(a[i - 1]))
                i -= 1
                j -= 1
            } else if dp[i][j - 1] >= dp[i - 1][j] {
                rev.append(.insert(b[j - 1]))
                j -= 1
            } else {
                rev.append(.delete(a[i - 1]))
                i -= 1
            }
        }
        while i > 0 {
            i -= 1
            rev.append(.delete(a[i]))
        }
        while j > 0 {
            j -= 1
            rev.append(.insert(b[j]))
        }

        var parts: [DiffOp] = []
        for piece in rev.reversed() {
            if let last = parts.last, sameType(last, piece) {
                parts[parts.count - 1] = merged(last, piece)
            } else {
                parts.append(piece)
            }
        }
        return parts
    }

    private static func extractJSON(_ raw: String) -> [String: Any]? {
        guard let start = raw.firstIndex(of: "{"),
              let end = raw.lastIndex(of: "}"),
              start < end else { return nil }
        let slice = String(raw[start...end])
        guard let data = slice.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        return object
    }

    private static func uniqueTrimmed(_ values: [String]) -> [String] {
        var seen = Set<String>()
        var out: [String] = []
        for value in values {
            let text = value.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !text.isEmpty, !seen.contains(text) else { continue }
            seen.insert(text)
            out.append(text)
            if out.count == 3 { break }
        }
        return out
    }

    private static func tokenize(_ text: String) -> [String] {
        guard !text.isEmpty else { return [] }
        var tokens: [String] = []
        var current = ""
        var inSpace: Bool?
        for ch in text {
            let space = ch.isWhitespace
            if let inSpace, inSpace != space {
                tokens.append(current)
                current = String(ch)
            } else {
                current.append(ch)
            }
            inSpace = space
        }
        if !current.isEmpty { tokens.append(current) }
        return tokens
    }

    private static func sameType(_ lhs: DiffOp, _ rhs: DiffOp) -> Bool {
        switch (lhs, rhs) {
        case (.equal, .equal), (.insert, .insert), (.delete, .delete):
            return true
        default:
            return false
        }
    }

    private static func merged(_ lhs: DiffOp, _ rhs: DiffOp) -> DiffOp {
        switch lhs {
        case .equal: return .equal(lhs.text + rhs.text)
        case .insert: return .insert(lhs.text + rhs.text)
        case .delete: return .delete(lhs.text + rhs.text)
        }
    }
}
