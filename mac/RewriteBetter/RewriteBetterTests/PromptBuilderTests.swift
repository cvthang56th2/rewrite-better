import XCTest

final class PromptBuilderTests: XCTestCase {
    func testRewriteWithoutExtraKeepsOriginalPrompt() {
        let prompt = PromptBuilder.buildRewrite(
            input: "hello",
            tone: "friendly",
            translationEnabled: false,
            fromLanguage: "auto",
            toLanguage: "en"
        )

        XCTAssertEqual(
            prompt,
            "Rewrite the following text in a friendly tone. Return only the rewritten text without any additional comments or explanations:\n\nhello"
        )
    }

    func testRewritePutsExtraInstructionsBeforeInput() {
        let prompt = PromptBuilder.buildRewrite(
            input: "hello",
            tone: "friendly",
            translationEnabled: false,
            fromLanguage: "auto",
            toLanguage: "en",
            extraInstructions: "Always write in Vietnamese. No emoji."
        )

        XCTAssertTrue(prompt.contains("Always write in Vietnamese. No emoji."))
        XCTAssertTrue(prompt.contains("hello"))
        XCTAssertTrue(prompt.contains("Return only the rewritten text") || prompt.lowercased().contains("return only the final output"))

        let extraIndex = prompt.range(of: "Always write in Vietnamese. No emoji.")!.lowerBound
        let inputIndex = prompt.range(of: "hello", options: String.CompareOptions.backwards)!.lowerBound
        XCTAssertLessThan(extraIndex, inputIndex)
    }

    func testRewriteIgnoresWhitespaceOnlyExtraInstructions() {
        let withBlank = PromptBuilder.buildRewrite(
            input: "hello",
            tone: "friendly",
            translationEnabled: false,
            fromLanguage: "auto",
            toLanguage: "en",
            extraInstructions: "   \n  "
        )
        let without = PromptBuilder.buildRewrite(
            input: "hello",
            tone: "friendly",
            translationEnabled: false,
            fromLanguage: "auto",
            toLanguage: "en"
        )

        XCTAssertEqual(withBlank, without)
    }

    func testFormatPutsExtraInstructionsBeforeInput() {
        let prompt = PromptBuilder.buildFormat(
            formatType: "markdown",
            input: "notes here",
            extraInstructions: "Never wrap the result in a code fence."
        )

        XCTAssertTrue(prompt.contains("Never wrap the result in a code fence."))
        XCTAssertTrue(prompt.contains("notes here"))
        XCTAssertTrue(prompt.contains("Return only the formatted Markdown") || prompt.lowercased().contains("return only the final output"))

        let extraIndex = prompt.range(of: "Never wrap the result in a code fence.")!.lowerBound
        let inputIndex = prompt.range(of: "notes here", options: String.CompareOptions.backwards)!.lowerBound
        XCTAssertLessThan(extraIndex, inputIndex)
    }

    func testReplyPutsExtraInstructionsBeforeReceivedMessage() throws {
        let prompt = try XCTUnwrap(
            PromptBuilder.buildReply(
                channel: "message",
                intent: "thank",
                tone: "friendly",
                length: "short",
                outputLanguage: "en",
                incomingText: "Thanks for the update",
                notes: "",
                extraInstructions: "Sign off as Thang."
            )
        )

        XCTAssertTrue(prompt.contains("Sign off as Thang."))
        XCTAssertTrue(prompt.contains("Thanks for the update"))
        XCTAssertTrue(prompt.contains("no explanations or meta commentary"))

        let extraIndex = prompt.range(of: "Sign off as Thang.")!.lowerBound
        let messageIndex = prompt.range(of: "Thanks for the update")!.lowerBound
        XCTAssertLessThan(extraIndex, messageIndex)
    }

    func testReplyIgnoresWhitespaceOnlyExtraInstructions() {
        let withBlank = PromptBuilder.buildReply(
            channel: "message",
            intent: "general",
            tone: "professional",
            length: "medium",
            outputLanguage: "en",
            incomingText: "Can we talk tomorrow?",
            notes: "",
            extraInstructions: "\n\t"
        )
        let without = PromptBuilder.buildReply(
            channel: "message",
            intent: "general",
            tone: "professional",
            length: "medium",
            outputLanguage: "en",
            incomingText: "Can we talk tomorrow?",
            notes: ""
        )

        XCTAssertEqual(withBlank, without)
    }
}
