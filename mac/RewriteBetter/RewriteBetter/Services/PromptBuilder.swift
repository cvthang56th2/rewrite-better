import Foundation

enum PromptBuilder {
    private static func langName(_ code: String) -> String {
        AppOptions.languageNames[code] ?? code
    }

    private static func variantsFormat() -> String {
        """
        Return ONLY valid JSON (no markdown) with this shape:
        {"variants":["...","...","..."]}
        Rules:
        - Provide exactly 3 complete alternatives.
        - Keep the same meaning and requested tone.
        - Make the variants meaningfully different in wording or structure.
        - Each item is the full output — no numbering, labels, or commentary.
        """
    }

    static func buildRewrite(
        input: String,
        tone: String,
        translationEnabled: Bool,
        fromLanguage: String,
        toLanguage: String,
        extraInstructions: String = "",
        voiceSamples: String = ""
    ) -> String {
        let instruction: String
        if translationEnabled {
            let toName = langName(toLanguage)
            if fromLanguage == "auto" {
                instruction = "First, translate the following text to \(toName), then rewrite it in a \(tone) tone. The output should be in \(toName) and maintain a \(tone) style.\n\(variantsFormat())"
            } else {
                let fromName = langName(fromLanguage)
                instruction = "First, translate the following text from \(fromName) to \(toName), then rewrite it in a \(tone) tone. The output should be in \(toName) and maintain a \(tone) style.\n\(variantsFormat())"
            }
        } else {
            instruction = "Rewrite the following text in a \(tone) tone.\n\(variantsFormat())"
        }
        return withUserContent(
            input,
            extraInstructions: extraInstructions,
            voiceSamples: voiceSamples,
            attachedTo: instruction
        )
    }

    static func buildFormat(formatType: String, input: String, extraInstructions: String = "") -> String {
        let prompts: [String: String] = [
            "markdown": "Convert the following text to well-structured Markdown format with appropriate headers, lists, emphasis, and formatting. Return only the formatted Markdown:",
            "html": "Convert the following text to clean, semantic HTML with appropriate tags, headings, paragraphs, and lists. Return only the HTML code:",
            "bullet-points": "Convert the following text into clear, concise bullet points. Organize the information hierarchically with main points and sub-points where appropriate. Return only the bullet points:",
            "numbered-list": "Convert the following text into a well-organized numbered list. Use hierarchical numbering (1, 2, 3, then a, b, c, etc.) where appropriate. Return only the numbered list:",
            "table": "Convert the following text into a well-formatted table. Identify the key information and organize it into appropriate columns and rows. Use markdown table format. Return only the table:",
            "outline": "Convert the following text into a detailed outline format with main topics, subtopics, and supporting details. Use standard outline formatting (I, A, 1, a, etc.). Return only the outline:",
            "summary": "Convert the following text into a professional executive summary with key points, main findings, and actionable insights. Keep it concise but comprehensive. Return only the summary:",
            "faq": "Convert the following text into a FAQ (Frequently Asked Questions) format. Extract key information and present it as questions and answers. Return only the FAQ:"
        ]
        let instruction = prompts[formatType] ?? prompts["bullet-points"]!
        return withUserContent(input, extraInstructions: extraInstructions, attachedTo: instruction)
    }

    static func buildReply(
        channel: String,
        intent: String,
        tone: String,
        length: String,
        outputLanguage: String,
        incomingText: String,
        notes: String,
        extraInstructions: String = "",
        voiceSamples: String = ""
    ) -> String? {
        let outLang = langName(outputLanguage)
        let isEmail = channel == "email"
        let channelDesc = isEmail
            ? "a complete email (include a subject line on the first line as \"Subject: ...\", then a blank line, then the body)"
            : "a chat/message reply suitable for Slack, Messenger, Zalo, or similar (no subject line)"

        let lengthMap = [
            "short": "Keep it brief — a few sentences at most.",
            "medium": "Use a moderate length — clear and complete without fluff.",
            "long": "Write a fuller response with enough detail and context."
        ]
        let lengthDesc = lengthMap[length] ?? lengthMap["medium"]!

        let intentMap = [
            "accept": "The goal is to accept / agree positively.",
            "decline": "The goal is to decline politely.",
            "ask": "The goal is to ask clarifying questions.",
            "follow-up": "The goal is to follow up and nudge for a response or next step.",
            "thank": "The goal is to thank the other person.",
            "general": "Respond appropriately based on the context and notes."
        ]
        let intentDesc = intentMap[intent] ?? intentMap["general"]!

        let hasIncoming = !incomingText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        let hasNotes = !notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty

        let task: String
        if hasIncoming && hasNotes {
            task = "Write \(channelDesc) as a reply to the received message below. Use the writer's notes as guidance for what to say."
        } else if hasIncoming {
            task = "Write \(channelDesc) as a reply to the received message below. Infer a helpful, natural response."
        } else if hasNotes {
            task = "Compose a new \(channelDesc) from the writer's notes/ideas below (there is no incoming message)."
        } else {
            return nil
        }

        var prompt = """
        \(task)
        Tone: \(tone).
        Intent: \(intentDesc)
        Length: \(lengthDesc)
        Write the entire output in \(outLang).
        \(variantsFormat())
        """

        prompt = appendExtraInstructions(extraInstructions, to: prompt)
        prompt = appendVoiceProfile(voiceSamples, to: prompt)

        if hasIncoming {
            prompt += "\n\n--- Received message ---\n\(incomingText.trimmingCharacters(in: .whitespacesAndNewlines))"
        }
        if hasNotes {
            prompt += "\n\n--- Writer's notes ---\n\(notes.trimmingCharacters(in: .whitespacesAndNewlines))"
        }
        return prompt
    }

    static func appendVoiceProfile(_ voiceSamples: String, to prompt: String) -> String {
        let samples = voiceSamples.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !samples.isEmpty else { return prompt }
        return """
        \(prompt)

        --- Writer's voice ---
        Match this writer's voice: vocabulary, sentence length, punctuation habits, and any mix of languages. Do not copy sentences verbatim.

        \(samples)
        """
    }

    private static func withUserContent(
        _ input: String,
        extraInstructions: String,
        voiceSamples: String = "",
        attachedTo instruction: String
    ) -> String {
        var prompt = appendExtraInstructions(extraInstructions, to: instruction)
        prompt = appendVoiceProfile(voiceSamples, to: prompt)
        let hasWrap = !extraInstructions.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || !voiceSamples.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        if !hasWrap {
            return "\(prompt)\n\n\(input)"
        }
        return """
        \(prompt)

        --- Text ---
        \(input)
        """
    }

    private static func appendExtraInstructions(_ extraInstructions: String, to prompt: String) -> String {
        let extra = extraInstructions.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !extra.isEmpty else { return prompt }
        return """
        \(prompt)

        --- Extra instructions ---
        \(extra)
        Follow the extra instructions, but still obey the output format required above.
        """
    }
}
