import Foundation

enum LLMError: LocalizedError {
    case missingKey
    case http(Int, String)
    case emptyResponse
    case network(String)
    case allKeysResting

    var errorDescription: String? {
        switch self {
        case .missingKey:
            return "❌ Chưa cấu hình API Key. Vui lòng vào Cài đặt."
        case .allKeysResting:
            return "❌ Tất cả API key đang tạm nghỉ đến ngày mai. Thêm key mới hoặc thử lại sau."
        case .http(let status, let message):
            switch status {
            case 401: return "❌ API Key không hợp lệ hoặc đã hết hạn."
            case 403: return "❌ Không có quyền truy cập API."
            case 429: return "❌ Đã vượt quá giới hạn requests trên tất cả API key."
            case 402: return "❌ Hết quota / cần thanh toán trên tất cả API key."
            case 500, 502, 503: return "❌ Lỗi server AI. Vui lòng thử lại sau."
            default: return "❌ Lỗi AI API: HTTP \(status) - \(message)"
            }
        case .emptyResponse:
            return "❌ Không thể xử lý văn bản."
        case .network(let message):
            return "❌ Lỗi kết nối mạng. \(message)"
        }
    }
}

/// OpenAI-compatible chat client with multi-provider / multi-key failover.
/// Failed keys are rested until the next local calendar day.
final class LLMClient {
    static let shared = LLMClient()

    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func complete(
        prompt: String,
        temperature: Double = 0.7,
        maxTokens: Int? = nil
    ) async throws -> String {
        let backends = SettingsStore.shared.resolveBackends()
        guard !backends.isEmpty else { throw LLMError.missingKey }

        var skipped = DailyKeySkipStore.activeSkipIds()
        do {
            let result = try await LLMProviders.callWithQuotaFallback(
                backends: backends,
                skipped: &skipped
            ) { backend in
                try await self.completeOnce(
                    prompt: prompt,
                    backend: backend,
                    temperature: temperature,
                    maxTokens: maxTokens ?? backend.defaultMaxTokens
                )
            }
            DailyKeySkipStore.markSkipped(skipped)
            return result
        } catch {
            DailyKeySkipStore.markSkipped(skipped)
            throw error
        }
    }

    struct KeyTestResult: Identifiable {
        let id: String
        let provider: String
        let keyHint: String
        let ok: Bool
        let detail: String
    }

    /// Tests every configured key and returns a per-key report (ignores daily skips).
    func testAllKeys() async -> [KeyTestResult] {
        let backends = SettingsStore.shared.resolveBackends()

        var results: [KeyTestResult] = []
        for backend in backends {
            let hint = Self.maskKey(backend.apiKey)
            do {
                _ = try await completeOnce(
                    prompt: "Reply with exactly: OK",
                    backend: backend,
                    temperature: 0.7,
                    maxTokens: 512
                )
                results.append(KeyTestResult(
                    id: backend.id,
                    provider: backend.provider.displayName,
                    keyHint: hint,
                    ok: true,
                    detail: "OK"
                ))
            } catch {
                results.append(KeyTestResult(
                    id: backend.id,
                    provider: backend.provider.displayName,
                    keyHint: hint,
                    ok: false,
                    detail: error.localizedDescription
                ))
            }
        }
        return results
    }

    private static func maskKey(_ key: String) -> String {
        let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count > 8 else { return "••••" }
        return "\(trimmed.prefix(4))…\(trimmed.suffix(4))"
    }

    /// Clears daily rests (e.g. after editing keys in Settings).
    func resetDailySkips() {
        DailyKeySkipStore.clearAll()
    }

    private func completeOnce(
        prompt: String,
        backend: ChatBackend,
        temperature: Double,
        maxTokens: Int
    ) async throws -> String {
        let urlString = backend.baseURL.hasSuffix("/")
            ? "\(backend.baseURL)chat/completions"
            : "\(backend.baseURL)/chat/completions"
        guard let url = URL(string: urlString) else {
            throw LLMError.network("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(backend.apiKey)", forHTTPHeaderField: "Authorization")

        var body: [String: Any] = [
            "model": backend.model,
            "messages": [["role": "user", "content": prompt]],
            "temperature": temperature,
            "max_tokens": maxTokens
        ]
        for (key, value) in LLMProviders.chatCompletionExtras(
            provider: backend.provider,
            model: backend.model
        ) {
            body[key] = value
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw LLMError.network("Invalid response")
            }
            if !(200..<300).contains(http.statusCode) {
                let bodyText = String(data: data, encoding: .utf8) ?? ""
                let json = (try? JSONSerialization.jsonObject(with: data) as? [String: Any]) ?? [:]
                let errObj = json["error"] as? [String: Any]
                let err = errObj?["message"] as? String
                    ?? errObj?["status"] as? String
                    ?? (bodyText.isEmpty ? "Lỗi không xác định" : String(bodyText.prefix(200)))
                throw LLMError.http(http.statusCode, err)
            }
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let choices = json?["choices"] as? [[String: Any]]
            let message = choices?.first?["message"] as? [String: Any]
            if let content = (message?["content"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines),
               !content.isEmpty {
                return content
            }
            if let reasoning = (message?["reasoning_content"] as? String)?
                .trimmingCharacters(in: .whitespacesAndNewlines),
               !reasoning.isEmpty {
                return reasoning
            }
            if let reasoning = (message?["reasoning"] as? String)?
                .trimmingCharacters(in: .whitespacesAndNewlines),
               !reasoning.isEmpty {
                return reasoning
            }
            throw LLMError.emptyResponse
        } catch let error as LLMError {
            throw error
        } catch {
            throw LLMError.network(error.localizedDescription)
        }
    }
}
