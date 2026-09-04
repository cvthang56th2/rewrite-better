import Foundation

enum AppMode: String, CaseIterable, Identifiable {
    case rewrite, format, reply

    var id: String { rawValue }

    var label: String {
        switch self {
        case .rewrite: return "Rewrite"
        case .format: return "Format"
        case .reply: return "Reply"
        }
    }

    var buttonLabel: String {
        switch self {
        case .rewrite: return "✨ Rewrite"
        case .format: return "📄 Format"
        case .reply: return "💬 Draft Reply"
        }
    }
}

struct OptionItem: Identifiable, Hashable {
    let value: String
    let label: String
    var id: String { value }
}

enum AppOptions {
    static let tones: [OptionItem] = [
        .init(value: "friendly", label: "Friendly"),
        .init(value: "professional", label: "Professional"),
        .init(value: "concise", label: "Concise"),
        .init(value: "persuasive", label: "Persuasive"),
        .init(value: "casual", label: "Casual")
    ]

    static let formatTypes: [OptionItem] = [
        .init(value: "markdown", label: "Markdown"),
        .init(value: "html", label: "HTML"),
        .init(value: "bullet-points", label: "Bullets"),
        .init(value: "numbered-list", label: "Numbered"),
        .init(value: "table", label: "Table"),
        .init(value: "outline", label: "Outline"),
        .init(value: "summary", label: "Summary"),
        .init(value: "faq", label: "FAQ")
    ]

    static let channels: [OptionItem] = [
        .init(value: "message", label: "Message"),
        .init(value: "email", label: "Email")
    ]

    static let intents: [OptionItem] = [
        .init(value: "accept", label: "Accept"),
        .init(value: "decline", label: "Decline"),
        .init(value: "ask", label: "Ask"),
        .init(value: "follow-up", label: "Follow up"),
        .init(value: "thank", label: "Thank"),
        .init(value: "general", label: "General")
    ]

    static let lengths: [OptionItem] = [
        .init(value: "short", label: "Short"),
        .init(value: "medium", label: "Medium"),
        .init(value: "long", label: "Long")
    ]

    static let languages: [OptionItem] = [
        .init(value: "auto", label: "Auto"),
        .init(value: "en", label: "English"),
        .init(value: "vi", label: "Vietnamese"),
        .init(value: "zh", label: "Chinese"),
        .init(value: "ja", label: "Japanese"),
        .init(value: "ko", label: "Korean"),
        .init(value: "fr", label: "French"),
        .init(value: "de", label: "German"),
        .init(value: "es", label: "Spanish"),
        .init(value: "it", label: "Italian"),
        .init(value: "pt", label: "Portuguese"),
        .init(value: "ru", label: "Russian"),
        .init(value: "ar", label: "Arabic"),
        .init(value: "hi", label: "Hindi"),
        .init(value: "th", label: "Thai")
    ]

    static let outputLanguages: [OptionItem] = languages.filter { $0.value != "auto" }

    static let languageNames: [String: String] = [
        "auto": "automatically detected language",
        "en": "English",
        "vi": "Vietnamese",
        "zh": "Chinese",
        "ja": "Japanese",
        "ko": "Korean",
        "fr": "French",
        "de": "German",
        "es": "Spanish",
        "it": "Italian",
        "pt": "Portuguese",
        "ru": "Russian",
        "ar": "Arabic",
        "hi": "Hindi",
        "th": "Thai"
    ]

    static let model = "openai/gpt-oss-20b"
}
