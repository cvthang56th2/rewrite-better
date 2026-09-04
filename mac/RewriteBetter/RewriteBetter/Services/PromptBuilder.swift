import Foundation

enum PromptBuilder {
    private static func langName(_ code: String) -> String {
        AppOptions.languageNames[code] ?? code
    }

    static func buildRewrite(input: String, tone: String, translationEnabled: Bool, fromLanguage: String, toLanguage: String) -> String {
        if translationEnabled {
            let toName = langName(toLanguage)
            if fromLanguage == "auto" {
                return "First, translate the following text to \(toName), then rewrite it in a \(tone) tone. The output should be in \(toName) and maintain a \(tone) style. Return only the final rewritten text without any explanations:\n\n\(input)"
            }
            let fromName = langName(fromLanguage)
            return "First, translate the following text from \(fromName) to \(toName), then rewrite it in a \(tone) tone. The output should be in \(toName) and maintain a \(tone) style. Return only the final rewritten text without any explanations:\n\n\(input)"
        }
        return "Rewrite the following text in a \(tone) tone. Return only the rewritten text without any additional comments or explanations:\n\n\(input)"
    }

    static func buildFormat(formatType: String, input: String) -> String {
        let prompts: [String: String] = [
            "markdown": "Convert the following text to well-structured Markdown format with appropriate headers, lists, emphasis, and formatting. Return only the formatted Markdown:\n\n\(input)",
            "html": "Convert the following text to clean, semantic HTML with appropriate tags, headings, paragraphs, and lists. Return only the HTML code:\n\n\(input)",
            "bullet-points": "Convert the following text into clear, concise bullet points. Organize the information hierarchically with main points and sub-points where appropriate. Return only the bullet points:\n\n\(input)",
            "numbered-list": "Convert the following text into a well-organized numbered list. Use hierarchical numbering (1, 2, 3, then a, b, c, etc.) where appropriate. Return only the numbered list:\n\n\(input)",
            "table": "Convert the following text into a well-formatted table. Identify the key information and organize it into appropriate columns and rows. Use markdown table format. Return only the table:\n\n\(input)",
            "outline": "Convert the following text into a detailed outline format with main topics, subtopics, and supporting details. Use standard outline formatting (I, A, 1, a, etc.). Return only the outline:\n\n\(input)",
            "summary": "Convert the following text into a professional executive summary with key points, main findings, and actionable insights. Keep it concise but comprehensive. Return only the summary:\n\n\(input)",
            "faq": "Convert the following text into a FAQ (Frequently Asked Questions) format. Extract key information and present it as questions and answers. Return only the FAQ:\n\n\(input)"
        ]
        return prompts[formatType] ?? prompts["bullet-points"]!
    }

    static func buildReply(
        channel: String,
        intent: String,
        tone: String,
        length: String,
        outputLanguage: String,
        incomingText: String,
        notes: String
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
        Return only the final \(isEmail ? "email (subject + body)" : "message") — no explanations or meta commentary.
        """

        if hasIncoming {
            prompt += "\n\n--- Received message ---\n\(incomingText.trimmingCharacters(in: .whitespacesAndNewlines))"
        }
        if hasNotes {
            prompt += "\n\n--- Writer's notes ---\n\(notes.trimmingCharacters(in: .whitespacesAndNewlines))"
        }
        return prompt
    }
}
