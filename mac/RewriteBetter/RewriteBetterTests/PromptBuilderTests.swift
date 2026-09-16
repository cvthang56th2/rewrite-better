import XCTest

final class PromptBuilderTests: XCTestCase {
    func testRewriteAsksForThreeVariants() {
        let prompt = PromptBuilder.buildRewrite(
            input: "hello",
            tone: "friendly",
            translationEnabled: false,
            fromLanguage: "auto",
            toLanguage: "en"
        )

        XCTAssertTrue(prompt.contains("friendly"))
        XCTAssertTrue(prompt.contains("{\"variants\":["))
        XCTAssertTrue(prompt.contains("exactly 3"))
        XCTAssertTrue(prompt.contains("\n\nhello"))
        XCTAssertFalse(prompt.contains("Writer's voice"))
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
        XCTAssertTrue(prompt.contains("{\"variants\":["))

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

    func testRewriteAttachesVoiceSamplesBeforeInput() {
        let prompt = PromptBuilder.buildRewrite(
            input: "hello",
            tone: "friendly",
            translationEnabled: false,
            fromLanguage: "auto",
            toLanguage: "en",
            voiceSamples: "hey can you send that when you get a chance? thanks!"
        )

        XCTAssertTrue(prompt.contains("Writer's voice"))
        XCTAssertTrue(prompt.contains("hey can you send that when you get a chance? thanks!"))
        let voiceIndex = prompt.range(of: "hey can you send that")!.lowerBound
        let inputIndex = prompt.range(of: "hello", options: .backwards)!.lowerBound
        XCTAssertLessThan(voiceIndex, inputIndex)
    }

    func testFormatPutsExtraInstructionsBeforeInput() {
        let prompt = PromptBuilder.buildFormat(
            formatType: "markdown",
            input: "notes here",
            extraInstructions: "Never wrap the result in a code fence."
        )

        XCTAssertTrue(prompt.contains("Never wrap the result in a code fence."))
        XCTAssertTrue(prompt.contains("notes here"))
        XCTAssertFalse(prompt.contains("{\"variants\":["))
        XCTAssertTrue(prompt.contains("Return only the formatted Markdown") || prompt.lowercased().contains("return only the final output") || prompt.contains("obey the output format"))

        let extraIndex = prompt.range(of: "Never wrap the result in a code fence.")!.lowerBound
        let inputIndex = prompt.range(of: "notes here", options: String.CompareOptions.backwards)!.lowerBound
        XCTAssertLessThan(extraIndex, inputIndex)
    }

    func testFormatIgnoresVoiceSamples() {
        let prompt = PromptBuilder.buildFormat(
            formatType: "markdown",
            input: "notes here"
        )
        XCTAssertFalse(prompt.contains("Writer's voice"))
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
        XCTAssertTrue(prompt.contains("{\"variants\":["))

        let extraIndex = prompt.range(of: "Sign off as Thang.")!.lowerBound
        let messageIndex = prompt.range(of: "Thanks for the update")!.lowerBound
        XCTAssertLessThan(extraIndex, messageIndex)
    }

    func testReplyAttachesVoiceBeforeReceivedMessage() throws {
        let prompt = try XCTUnwrap(
            PromptBuilder.buildReply(
                channel: "message",
                intent: "thank",
                tone: "friendly",
                length: "short",
                outputLanguage: "en",
                incomingText: "Hi",
                notes: "",
                voiceSamples: "yeah that works, I can do Thursday."
            )
        )
        XCTAssertTrue(prompt.contains("Writer's voice"))
        XCTAssertTrue(prompt.contains("yeah that works, I can do Thursday."))
        let voiceIndex = prompt.range(of: "yeah that works")!.lowerBound
        let messageIndex = prompt.range(of: "--- Received message ---")!.lowerBound
        XCTAssertLessThan(voiceIndex, messageIndex)
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
