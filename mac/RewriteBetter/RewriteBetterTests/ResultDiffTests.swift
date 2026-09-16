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

    func testWordDiffMarksReplacement() {
        let equal = ResultDiff.diffWords(original: "hello world", next: "hello world")
        XCTAssertEqual(equal, [.equal("hello world")])
        XCTAssertFalse(ResultDiff.hasVisibleDiff(equal))

        let swapped = ResultDiff.diffWords(original: "send the file", next: "send the docs")
        XCTAssertTrue(swapped.contains { if case .delete(let text) = $0 { return text.contains("file") } else { return false } })
        XCTAssertTrue(swapped.contains { if case .insert(let text) = $0 { return text.contains("docs") } else { return false } })
        XCTAssertTrue(ResultDiff.hasVisibleDiff(swapped))
    }
}
