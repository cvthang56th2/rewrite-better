import Foundation

enum WritingAssistPrompts {
    static func autocomplete(prefix: String) -> String {
        let trimmed = prefix.trimmingCharacters(in: .whitespacesAndNewlines)
        let endsSentence = trimmed.isEmpty
            || trimmed.last.map { ".!?…".contains($0) } == true
            || trimmed.hasSuffix("\n")

        if endsSentence {
            return """
            You are a writing autocomplete engine like Cursor Tab.
            The writer just finished a sentence or paragraph. Suggest a short natural continuation (1–3 sentences) that could come next.
            Match the writer's language and style.
            Return ONLY the continuation text to append — no quotes, no explanation, no repeating the existing text.

            Existing text:
            \(prefix)
            """
        }

        return """
        You are a writing autocomplete engine like Cursor Tab.
        The writer is mid-sentence. Complete the current sentence naturally (and only that sentence ending).
        Match the writer's language and style.
        Return ONLY the missing suffix to append at the caret — no quotes, no explanation, no repeating text already written.

        Text so far:
        \(prefix)
        """
    }

    static func grammarCheck(text: String) -> String {
        """
        Review the text for grammar, spelling, clarity, and tone issues.
        Return ONLY valid JSON (no markdown) with this shape:
        {"issues":[{"kind":"grammar|spelling|tone|clarity","message":"short reason","original":"exact substring from text","replacement":"fixed substring"}]}
        Rules:
        - "original" MUST be an exact contiguous substring of the input.
        - Prefer at most 8 high-value issues.
        - If nothing to fix, return {"issues":[]}.

        Text:
        \(text)
        """
    }
}
