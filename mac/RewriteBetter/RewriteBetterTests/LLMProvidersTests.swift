import XCTest

final class LLMProvidersTests: XCTestCase {
    func testNetworkErrorTriesNextKeyWithoutResting() async throws {
        var skipped: Set<String> = []
        var tried: [String] = []
        let result = try await LLMProviders.callWithQuotaFallback(
            backends: [backend("a"), backend("b")],
            skipped: &skipped
        ) { item in
            tried.append(item.skipId)
            if item.skipId == "a" {
                throw LLMError.network("offline")
            }
            return "ok"
        }

        XCTAssertEqual(result, "ok")
        XCTAssertEqual(tried, ["a", "b"])
        XCTAssertFalse(skipped.contains("a"))
        XCTAssertFalse(skipped.contains("b"))
    }

    func testQuotaErrorRestsKeyAndContinues() async throws {
        var skipped: Set<String> = []
        let result = try await LLMProviders.callWithQuotaFallback(
            backends: [backend("a"), backend("b")],
            skipped: &skipped
        ) { item in
            if item.skipId == "a" {
                throw LLMError.http(429, "rate limit")
            }
            return "ok"
        }

        XCTAssertEqual(result, "ok")
        XCTAssertTrue(skipped.contains("a"))
        XCTAssertFalse(skipped.contains("b"))
    }

    func testAuthErrorRestsKey() async throws {
        var skipped: Set<String> = []
        _ = try await LLMProviders.callWithQuotaFallback(
            backends: [backend("a"), backend("b")],
            skipped: &skipped
        ) { item in
            if item.skipId == "a" {
                throw LLMError.http(401, "invalid")
            }
            return "ok"
        }

        XCTAssertTrue(skipped.contains("a"))
    }

    func testEmptyResponseDoesNotRestKey() async throws {
        var skipped: Set<String> = []
        _ = try await LLMProviders.callWithQuotaFallback(
            backends: [backend("a"), backend("b")],
            skipped: &skipped
        ) { item in
            if item.skipId == "a" {
                throw LLMError.emptyResponse
            }
            return "ok"
        }

        XCTAssertFalse(skipped.contains("a"))
    }

    func testDisabledProviderIsOmittedFromChain() {
        let backends = LLMProviders.resolveChatBackends(
            keysByProvider: [
                .gemini: "AIza-first",
                .groq: "gsk_mid",
                .cerebras: "csk_third",
                .openai: "sk-last"
            ],
            enabledProviders: [.groq: false]
        )
        XCTAssertEqual(backends.map(\.provider), [.gemini, .cerebras, .openai])
    }

    func testDisabledProvidersWithKeysYieldEmptyChain() {
        let backends = LLMProviders.resolveChatBackends(
            keysByProvider: [.gemini: "AIza", .openai: "sk-last"],
            enabledProviders: [.gemini: false, .openai: false]
        )
        XCTAssertTrue(backends.isEmpty)
    }

    func testMissingEnabledFlagDefaultsToOn() {
        let backends = LLMProviders.resolveChatBackends(
            keysByProvider: [.gemini: "AIza", .openai: "sk-last"]
        )
        XCTAssertEqual(backends.map(\.provider), [.gemini, .openai])
    }

    private func backend(_ skipId: String) -> ChatBackend {
        ChatBackend(
            id: skipId,
            skipId: skipId,
            provider: .groq,
            keyIndex: 1,
            apiKey: "test-key",
            baseURL: "https://example.invalid",
            model: "test",
            defaultMaxTokens: 16
        )
    }
}
