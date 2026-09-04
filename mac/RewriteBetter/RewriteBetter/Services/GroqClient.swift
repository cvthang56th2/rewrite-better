import Foundation

enum GroqError: LocalizedError {
    case missingKey
    case http(Int, String)
    case emptyResponse
    case network(String)

    var errorDescription: String? {
        switch self {
        case .missingKey:
            return "❌ Chưa cấu hình Groq API Key. Vui lòng vào Cài đặt."
        case .http(let status, let message):
            switch status {
            case 401: return "❌ API Key không hợp lệ hoặc đã hết hạn."
            case 403: return "❌ Không có quyền truy cập API."
            case 429: return "❌ Đã vượt quá giới hạn requests. Vui lòng thử lại sau."
            case 500, 502, 503: return "❌ Lỗi server Groq. Vui lòng thử lại sau."
            default: return "❌ Lỗi Groq API: HTTP \(status) - \(message)"
            }
        case .emptyResponse:
            return "❌ Không thể xử lý văn bản."
        case .network(let message):
            return "❌ Lỗi kết nối mạng. \(message)"
        }
    }
}

struct GroqClient {
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func complete(
        prompt: String,
        apiKey: String,
        temperature: Double = 0.7,
        maxTokens: Int = 1024
    ) async throws -> String {
        guard let url = URL(string: "https://api.groq.com/openai/v1/chat/completions") else {
            throw GroqError.network("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "model": AppOptions.model,
            "messages": [["role": "user", "content": prompt]],
            "temperature": temperature,
            "max_tokens": maxTokens
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw GroqError.network("Invalid response")
            }
            if !(200..<300).contains(http.statusCode) {
                let json = (try? JSONSerialization.jsonObject(with: data) as? [String: Any]) ?? [:]
                let err = (json["error"] as? [String: Any])?["message"] as? String ?? "Lỗi không xác định"
                throw GroqError.http(http.statusCode, err)
            }
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let choices = json?["choices"] as? [[String: Any]]
            let message = choices?.first?["message"] as? [String: Any]
            let content = (message?["content"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
            guard let content, !content.isEmpty else {
                throw GroqError.emptyResponse
            }
            return content
        } catch let error as GroqError {
            throw error
        } catch {
            throw GroqError.network(error.localizedDescription)
        }
    }

    func testApiKey(_ apiKey: String) async -> Bool {
        do {
            _ = try await complete(prompt: "Say OK", apiKey: apiKey)
            return true
        } catch {
            return false
        }
    }
}
