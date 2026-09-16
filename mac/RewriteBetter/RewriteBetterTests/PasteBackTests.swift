import XCTest

final class PasteBackTests: XCTestCase {
    func testEmptyResultIsUnavailable() {
        let target = PasteBackTarget(pid: 42, appName: "Notes", hadSelection: true)
        XCTAssertEqual(PasteBackService.availability(resultText: "", target: target), .unavailable)
        XCTAssertEqual(PasteBackService.availability(resultText: "   ", target: target), .unavailable)
    }

    func testMissingTargetIsUnavailable() {
        XCTAssertEqual(
            PasteBackService.availability(resultText: "rewritten", target: nil),
            .unavailable
        )
    }

    func testSelectionUsesReplaceLabel() {
        let target = PasteBackTarget(pid: 42, appName: "Slack", hadSelection: true)
        XCTAssertEqual(
            PasteBackService.availability(resultText: "rewritten", target: target),
            .replace(appName: "Slack")
        )
        XCTAssertEqual(target.actionTitle, "Replace")
    }

    func testCaretUsesPasteLabel() {
        let target = PasteBackTarget(pid: 7, appName: "Safari", hadSelection: false)
        XCTAssertEqual(
            PasteBackService.availability(resultText: "rewritten", target: target),
            .paste(appName: "Safari")
        )
        XCTAssertEqual(target.actionTitle, "Paste")
    }

    func testAccessibilitySuccessDoesNotSendCommandV() {
        let env = MockPasteBackEnvironment()
        env.axSucceeds = true
        let target = PasteBackTarget(pid: 42, appName: "Notes", hadSelection: true)

        let result = PasteBackService.perform(text: "hello", target: target, using: env)

        XCTAssertEqual(result, .replacedViaAccessibility)
        XCTAssertEqual(env.copied, "hello")
        XCTAssertEqual(env.axText, "hello")
        XCTAssertTrue(env.resigned)
        XCTAssertEqual(env.activatedPID, 42)
        XCTAssertFalse(env.pasted)
    }

    func testAccessibilityFailureFallsBackToCommandV() {
        let env = MockPasteBackEnvironment()
        env.axSucceeds = false
        let target = PasteBackTarget(pid: 99, appName: "Chrome", hadSelection: true)

        let result = PasteBackService.perform(text: "world", target: target, using: env)

        XCTAssertEqual(result, .replacedViaPaste)
        XCTAssertEqual(env.copied, "world")
        XCTAssertTrue(env.resigned)
        XCTAssertEqual(env.activatedPID, 99)
        XCTAssertTrue(env.pasted)
    }

    func testActivateFailureDoesNotSendCommandV() {
        let env = MockPasteBackEnvironment()
        env.axSucceeds = false
        env.activateSucceeds = false
        let target = PasteBackTarget(pid: 1, appName: "Mail", hadSelection: true)

        let result = PasteBackService.perform(text: "hi", target: target, using: env)

        XCTAssertEqual(result, .activateFailed)
        XCTAssertTrue(env.resigned)
        XCTAssertFalse(env.pasted)
    }

    func testEmptyTextDoesNotTouchTheSourceApp() {
        let env = MockPasteBackEnvironment()
        let target = PasteBackTarget(pid: 42, appName: "Notes", hadSelection: true)

        let result = PasteBackService.perform(text: " \n ", target: target, using: env)

        XCTAssertEqual(result, .emptyText)
        XCTAssertNil(env.copied)
        XCTAssertFalse(env.resigned)
        XCTAssertFalse(env.pasted)
    }

    func testNoTargetDoesNotTouchClipboard() {
        let env = MockPasteBackEnvironment()

        let result = PasteBackService.perform(text: "hello", target: nil, using: env)

        XCTAssertEqual(result, .noTarget)
        XCTAssertNil(env.copied)
        XCTAssertFalse(env.resigned)
        XCTAssertFalse(env.pasted)
    }

    func testDetectsAppendInsteadOfReplace() {
        XCTAssertFalse(
            PasteBackAX.didReplaceNotAppend(
                original: "việt nam vô địch",
                replacement: "Việt Nam là vô địch!",
                valueAfter: "việt nam vô địchViệt Nam là vô địch!"
            )
        )
        XCTAssertFalse(
            PasteBackAX.didReplaceNotAppend(
                original: "việt nam vô địch",
                replacement: "Việt Nam là vô địch!",
                valueAfter: "Việt Nam là vô địch!việt nam vô địch"
            )
        )
        XCTAssertTrue(
            PasteBackAX.didReplaceNotAppend(
                original: "việt nam vô địch",
                replacement: "Việt Nam là vô địch!",
                valueAfter: "Việt Nam là vô địch!"
            )
        )
        XCTAssertTrue(
            PasteBackAX.didReplaceNotAppend(
                original: "việt nam vô địch",
                replacement: "Việt Nam là vô địch!",
                valueAfter: "prefix Việt Nam là vô địch! suffix"
            )
        )
    }

    func testSelectionMatchesOriginalAfterCanonicalMapping() {
        XCTAssertTrue(
            PasteBackAX.selectionMatchesOriginal("việt nam vô địch", original: "việt nam vô địch")
        )
        XCTAssertTrue(
            PasteBackAX.selectionMatchesOriginal("  việt nam vô địch\n", original: "việt nam vô địch")
        )
        XCTAssertFalse(
            PasteBackAX.selectionMatchesOriginal(
                "việt nam vô địchViệt Nam là vô địch!",
                original: "việt nam vô địch"
            )
        )
        XCTAssertFalse(PasteBackAX.selectionMatchesOriginal("", original: "việt nam vô địch"))
        XCTAssertFalse(PasteBackAX.selectionMatchesOriginal("hello", original: "việt nam vô địch"))
    }

    func testGraphemeCountUsesCharactersNotUTF16() {
        XCTAssertEqual(PasteBackAX.graphemeCount("việt nam vô địch"), 16)
        XCTAssertEqual(PasteBackAX.graphemeCount("  việt nam vô địch  "), 16)
    }

    func testSplicesOriginalRangeInFieldValue() {
        XCTAssertEqual(
            PasteBackAX.splice(
                value: "aaa việt nam vô địch bbb",
                range: NSRange(location: 4, length: 16),
                replacement: "Việt Nam là vô địch!"
            ),
            "aaa Việt Nam là vô địch! bbb"
        )
    }

    func testSelectionFallbackRestoresRangeBeforePaste() {
        let env = MockPasteBackEnvironment()
        env.axSucceeds = false
        let target = PasteBackTarget(pid: 99, appName: "Notes", hadSelection: true)

        _ = PasteBackService.perform(text: "Việt Nam là vô địch!", target: target, using: env)

        XCTAssertEqual(env.order, ["copy", "ax", "resign", "activate", "restore", "paste"])
    }

    func testCaretPasteSkipsAccessibilityReplace() {
        let env = MockPasteBackEnvironment()
        let target = PasteBackTarget(pid: 5, appName: "Notes", hadSelection: false)

        _ = PasteBackService.perform(text: "draft", target: target, using: env)

        XCTAssertEqual(env.order, ["copy", "resign", "activate", "paste"])
        XCTAssertNil(env.axText)
    }
}

private final class MockPasteBackEnvironment: PasteBackPerforming {
    var axSucceeds = false
    var activateSucceeds = true
    var copied: String?
    var axText: String?
    var resigned = false
    var activatedPID: pid_t?
    var pasted = false
    var restored = false
    private(set) var order: [String] = []

    func copyToClipboard(_ text: String) {
        order.append("copy")
        copied = text
    }

    func replaceSelectionViaAccessibility(_ text: String) -> Bool {
        order.append("ax")
        axText = text
        return axSucceeds
    }

    func resignPanel() {
        order.append("resign")
        resigned = true
    }

    func activateSourceApp(pid: pid_t) -> Bool {
        order.append("activate")
        activatedPID = pid
        return activateSucceeds
    }

    func restoreSelection() {
        order.append("restore")
        restored = true
    }

    func sendPasteKeystroke() {
        order.append("paste")
        pasted = true
    }
}
