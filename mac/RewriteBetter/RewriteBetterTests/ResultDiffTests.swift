import XCTest

final class ResultDiffTests: XCTestCase {
    func testParseVariantsFromJSON() {
        XCTAssertEqual(ResultDiff.parseVariants("{\"variants\":[\"A\",\"B\",\"C\"]}"), ["A", "B", "C"])
        XCTAssertEqual(
            ResultDiff.parseVariants("```json\n{\"variants\":[\"one\",\"two\",\"three\"]}\n```"),
            ["one", "two", "three"]
        )
        XCTAssertEqual(ResultDiff.parseVariants("just a rewrite"), ["just a rewrite"])
        XCTAssertEqual(ResultDiff.parseVariants("{\"variants\":[\"keep\",\"keep\",\"other\"]}"), ["keep", "other"])
        XCTAssertEqual(ResultDiff.parseVariants("{\"variants\":[\"a\",\"b\",\"c\",\"d\"]}"), ["a", "b", "c"])
        XCTAssertEqual(ResultDiff.parseVariants("{\"variants\":[\"\",\"  \"]}"), [])
        XCTAssertEqual(ResultDiff.parseVariants("  {\"variants\":[\" spaced \"]}  extra"), ["spaced"])
    }

    func testParseVariantsRepairsUnescapedNewlines() {
        let raw = "{\"variants\":[\"Hello\nthere\",\"Other take\",\"Third\"]} "
        XCTAssertEqual(ResultDiff.parseVariants(raw), ["Hello\nthere", "Other take", "Third"])
    }

    func testParseVariantsRepairsTrailingComma() {
        XCTAssertEqual(
            ResultDiff.parseVariants("{\"variants\":[\"A\",\"B\",\"C\",]}"),
            ["A", "B", "C"]
        )
    }

    func testParseVariantsCoercesObjectItems() {
        XCTAssertEqual(
            ResultDiff.parseVariants("{\"variants\":[{\"text\":\"A\"},{\"text\":\"B\"},{\"content\":\"C\"}]}"),
            ["A", "B", "C"]
        )
    }

    func testWordDiffMarksReplacement() {
        let equal = ResultDiff.diffWords(original: "hello world", next: "hello world")
        XCTAssertEqual(equal, [.equal("hello world")])
        XCTAssertFalse(ResultDiff.hasVisibleDiff(equal))

        let swapped = ResultDiff.diffWords(original: "send the file", next: "send the docs")
        XCTAssertTrue(swapped.contains { if case .delete(let text) = $0 { return text.contains("file") } else { return false } })
        XCTAssertTrue(swapped.contains { if case .insert(let text) = $0 { return text.contains("docs") } else { return false } })
        XCTAssertTrue(ResultDiff.hasVisibleDiff(swapped))
    }

    func testParseRefineTextTakesFirstVariantOrPlainText() {
        XCTAssertEqual(ResultDiff.parseRefineText("just a rewrite"), "just a rewrite")
        XCTAssertEqual(ResultDiff.parseRefineText("{\"variants\":[\"A\",\"B\",\"C\"]}"), "A")
        XCTAssertEqual(ResultDiff.parseRefineText("```\nhello\n```"), "hello")
        XCTAssertEqual(ResultDiff.parseRefineText("  "), "")
    }

    func testReplaceSelectedVariantLeavesOthersUnchanged() {
        let original = ["one", "two", "three"]
        XCTAssertEqual(ResultDiff.replaceSelectedVariant(original, index: 1, with: "TWO"), ["one", "TWO", "three"])
        XCTAssertEqual(original, ["one", "two", "three"])
        XCTAssertEqual(ResultDiff.replaceSelectedVariant(["one", "two"], index: 0, with: "  "), ["one", "two"])
        XCTAssertEqual(ResultDiff.replaceSelectedVariant(["one"], index: 4, with: "x"), ["one"])
    }

    func testRefineHistoriesStayPerVariant() {
        let empty = ResultDiff.emptyRefineHistories(count: 3)
        XCTAssertEqual(empty.count, 3)
        XCTAssertEqual(ResultDiff.refineHistory(empty, index: 1), [])

        let afterOne = ResultDiff.appendRefineTurn(empty, index: 1, userText: "Make it shorter.", assistantText: "Hi.")
        XCTAssertEqual(ResultDiff.refineHistory(empty, index: 1), [])
        XCTAssertEqual(ResultDiff.refineHistory(afterOne, index: 0), [])
        XCTAssertEqual(
            ResultDiff.refineHistory(afterOne, index: 1),
            [
                RefineTurn(role: "user", text: "Make it shorter."),
                RefineTurn(role: "assistant", text: "Hi.")
            ]
        )
        XCTAssertEqual(ResultDiff.refineHistory(afterOne, index: 2), [])

        let afterTwo = ResultDiff.appendRefineTurn(afterOne, index: 1, userText: "Add a greeting.", assistantText: "Hi there.")
        XCTAssertEqual(ResultDiff.refineHistory(afterTwo, index: 1).count, 4)
        XCTAssertEqual(ResultDiff.refineHistory(afterOne, index: 1).count, 2)
    }
}
