import Foundation

enum ChatProvider: String, CaseIterable, Identifiable {
    case gemini, groq, cerebras, openai

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .gemini: return "Gemini"
        case .groq: return "Groq"
        case .cerebras: return "Cerebras"
        case .openai: return "OpenAI"
        }
    }

    var placeholder: String {
        switch self {
        case .gemini: return "AIza… (comma or newline for multiple)"
        case .groq: return "gsk_… (comma or newline for multiple)"
        case .cerebras: return "csk_… (comma or newline for multiple)"
        case .openai: return "sk-… (comma or newline for multiple)"
        }
    }

    var keyPrefixHint: String {
        switch self {
        case .gemini: return "AIza"
        case .groq: return "gsk_"
        case .cerebras: return "csk_"
        case .openai: return "sk-"
        }
    }

    var helpURL: URL {
        switch self {
        case .gemini: return URL(string: "https://aistudio.google.com/apikey")!
        case .groq: return URL(string: "https://console.groq.com/keys")!
        case .cerebras: return URL(string: "https://cloud.cerebras.ai")!
        case .openai: return URL(string: "https://platform.openai.com/api-keys")!
        }
    }

    var helpSummary: String {
        switch self {
        case .gemini:
            return "Tried first. Google AI Studio gives a free quota after you sign in with Google."
        case .groq:
            return "Second fallback. Groq is fast and has a free tier after you create an account."
        case .cerebras:
            return "Third fallback. Cerebras Cloud has a free trial. Open API Keys in the left sidebar."
        case .openai:
            return "Last in the chain. Create a secret key on the OpenAI platform. Billing is required after any trial."
        }
    }

    var helpSteps: [String] {
        switch self {
        case .gemini:
            return [
                "Open Google AI Studio (link below).",
                "Sign in with your Google account.",
                "Click Create API key. Create or pick a Google Cloud project if asked.",
                "Copy the key and paste it here. It starts with \(keyPrefixHint)."
            ]
        case .groq:
            return [
                "Open Groq Console (link below).",
                "Sign up or sign in.",
                "Open API Keys and create a new key.",
                "Copy it and paste here. It starts with \(keyPrefixHint)."
            ]
        case .cerebras:
            return [
                "Open Cerebras Cloud (link below).",
                "Sign up or sign in.",
                "Open API Keys in the left sidebar. On a paid account, pick a project first.",
                "Generate a key, copy it, and paste here. It starts with \(keyPrefixHint)."
            ]
        case .openai:
            return [
                "Open the OpenAI API keys page (link below).",
                "Sign in to your OpenAI account.",
                "Click Create new secret key and copy it immediately.",
                "Paste it here. It starts with \(keyPrefixHint)."
            ]
        }
    }
}

struct ChatBackend: Identifiable {
    /// Display / chain id, e.g. `gemini#2`.
    let id: String
    /// Stable skip id based on key fingerprint (survives reorder), e.g. `gemini:a1b2c3d4`.
    let skipId: String
    let provider: ChatProvider
    let keyIndex: Int
    let apiKey: String
    let baseURL: String
    let model: String
    let defaultMaxTokens: Int
}

struct ProviderSpec {
    let baseURL: String
    let defaultModel: String
    let defaultMaxTokens: Int
}

enum LLMProviders {
    /// Gemini → Groq → Cerebras, then OpenAI last (same as sewe).
    static let fallbackOrder: [ChatProvider] = [.gemini, .groq, .cerebras]

    static let specs: [ChatProvider: ProviderSpec] = [
        .gemini: .init(
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
            defaultModel: "gemini-flash-latest",
            defaultMaxTokens: 8192
        ),
        .groq: .init(
            baseURL: "https://api.groq.com/openai/v1",
            defaultModel: "openai/gpt-oss-20b",
            defaultMaxTokens: 4096
        ),
        .cerebras: .init(
            baseURL: "https://api.cerebras.ai/v1",
            defaultModel: "gpt-oss-120b",
            defaultMaxTokens: 8192
        ),
        .openai: .init(
            baseURL: "https://api.openai.com/v1",
            defaultModel: "gpt-4o-mini",
            defaultMaxTokens: 16384
        )
    ]

    /// Split one or more raw values into unique API keys (comma / semicolon / newline).
    static func parseApiKeys(_ rawValues: String...) -> [String] {
        var keys: [String] = []
        var seen = Set<String>()
        for value in rawValues {
            let parts = value.components(separatedBy: CharacterSet(charactersIn: ",;\n\r"))
            for part in parts {
                let key = part.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !key.isEmpty, !seen.contains(key) else { continue }
                seen.insert(key)
                keys.append(key)
            }
        }
        return keys
    }

    static func isQuotaError(_ error: Error) -> Bool {
        if let llm = error as? LLMError {
            switch llm {
            case .http(let status, let message):
                if status == 429 || status == 402 { return true }
                return matchesQuotaText(message)
            case .missingKey, .emptyResponse, .network, .allKeysResting:
                return false
            }
        }
        return matchesQuotaText(error.localizedDescription)
    }

    /// Auth / not-found / hard provider failures (kept for diagnostics / tests).
    static func isStickySkipError(_ error: Error) -> Bool {
        if isQuotaError(error) { return true }
        if let llm = error as? LLMError {
            switch llm {
            case .http(let status, _):
                return status == 401 || status == 403 || status == 404
            case .missingKey, .emptyResponse, .network, .allKeysResting:
                return false
            }
        }
        return false
    }

    static func resolveChatBackends(keysByProvider: [ChatProvider: String]) -> [ChatBackend] {
        var chain = fallbackOrder.flatMap { buildBackends($0, raw: keysByProvider[$0] ?? "") }
        let openai = buildBackends(.openai, raw: keysByProvider[.openai] ?? "")
        if !chain.isEmpty {
            return openai.isEmpty ? chain : chain + openai
        }
        return openai
    }

    static func callWithQuotaFallback<T>(
        backends: [ChatBackend],
        skipped: inout Set<String>,
        call: (ChatBackend) async throws -> T
    ) async throws -> T {
        guard !backends.isEmpty else {
            throw LLMError.missingKey
        }

        let active = backends.filter { !skipped.contains($0.skipId) }
        // If every key is resting until tomorrow, surface that instead of retrying them.
        guard !active.isEmpty else {
            throw LLMError.allKeysResting
        }

        var lastError: Error?
        for (index, backend) in active.enumerated() {
            do {
                return try await call(backend)
            } catch {
                lastError = error
                // Any failure during process → rest this key until tomorrow.
                skipped.insert(backend.skipId)
                if index + 1 < active.count {
                    continue
                }
                throw error
            }
        }
        throw lastError ?? LLMError.emptyResponse
    }

    private static func buildBackends(_ provider: ChatProvider, raw: String) -> [ChatBackend] {
        guard let spec = specs[provider] else { return [] }
        let keys = parseApiKeys(raw)
        return keys.enumerated().map { index, apiKey in
            ChatBackend(
                id: "\(provider.rawValue)#\(index + 1)",
                skipId: "\(provider.rawValue):\(fingerprint(apiKey))",
                provider: provider,
                keyIndex: index + 1,
                apiKey: apiKey,
                baseURL: spec.baseURL,
                model: spec.defaultModel,
                defaultMaxTokens: spec.defaultMaxTokens
            )
        }
    }

    private static func fingerprint(_ apiKey: String) -> String {
        var hash: UInt64 = 5381
        for byte in apiKey.utf8 {
            hash = ((hash << 5) &+ hash) &+ UInt64(byte)
        }
        return String(hash, radix: 16)
    }

    /// Provider-specific chat-completion fields for reasoning models.
    /// Groq accepts `include_reasoning`; Cerebras rejects it with HTTP 400
    /// `wrong_api_format`.
    static func chatCompletionExtras(provider: ChatProvider, model: String) -> [String: Any] {
        let id = model.lowercased()
        switch provider {
        case .groq:
            if id.contains("qwen") {
                return [
                    "reasoning_effort": "none",
                    "reasoning_format": "parsed"
                ]
            }
            if id.contains("gpt-oss") {
                return [
                    "reasoning_effort": "low",
                    "include_reasoning": false
                ]
            }
            return [:]
        case .cerebras:
            // Cerebras gpt-oss has no `include_reasoning`; unknown fields 400.
            if id.contains("qwen") {
                return ["reasoning_effort": "none"]
            }
            if id.contains("gpt-oss") {
                return ["reasoning_effort": "low"]
            }
            return [:]
        case .gemini, .openai:
            return [:]
        }
    }

    private static func matchesQuotaText(_ message: String) -> Bool {
        let lower = message.lowercased()
        if lower.range(of: #"payment required|visit your billing"#, options: .regularExpression) != nil {
            return true
        }
        return lower.range(
            of: #"quota|rate.?limit|resource.?exhausted|too many requests|insufficient_quota"#,
            options: .regularExpression
        ) != nil
    }
}
