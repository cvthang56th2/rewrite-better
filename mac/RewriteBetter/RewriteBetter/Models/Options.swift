import Foundation
import SwiftUI

enum Theme {
    static let radius: CGFloat = 10
    static let chipMinHeight: CGFloat = 28
    static let controlMin: CGFloat = 28

    static var line: Color { Color.secondary.opacity(0.22) }
    static var fill: Color { Color(nsColor: .controlBackgroundColor) }
    static var editor: Color { Color(nsColor: .textBackgroundColor) }
    static var warningFill: Color { Color.orange.opacity(0.12) }
    static var insertFill: Color { Color.green.opacity(0.16) }
    static var deleteFill: Color { Color.red.opacity(0.14) }
}

enum AppMode: String, CaseIterable, Identifiable {
    case rewrite, format, reply

    var id: String { rawValue }

    func label(_ language: AppLanguage) -> String {
        L10n.t("mode.\(rawValue)", language: language)
    }

    func buttonLabel(_ language: AppLanguage) -> String {
        L10n.t("action.\(rawValue)", language: language)
    }
}

struct OptionItem: Identifiable, Hashable {
    let value: String
    let label: String
    var id: String { value }
}

enum AppOptions {
    static func tones(_ language: AppLanguage) -> [OptionItem] {
        localized(language, prefix: "tone", values: ["friendly", "professional", "concise", "persuasive", "casual"])
    }

    static func formatTypes(_ language: AppLanguage) -> [OptionItem] {
        localized(language, prefix: "format", values: [
            "markdown", "html", "bullet-points", "numbered-list", "table", "outline", "summary", "faq"
        ])
    }

    static func channels(_ language: AppLanguage) -> [OptionItem] {
        localized(language, prefix: "channel", values: ["message", "email"])
    }

    static func intents(_ language: AppLanguage) -> [OptionItem] {
        localized(language, prefix: "intent", values: ["accept", "decline", "ask", "follow-up", "thank", "general"])
    }

    static func lengths(_ language: AppLanguage) -> [OptionItem] {
        localized(language, prefix: "length", values: ["short", "medium", "long"])
    }

    private static func localized(_ language: AppLanguage, prefix: String, values: [String]) -> [OptionItem] {
        values.map { .init(value: $0, label: L10n.t("\(prefix).\($0)", language: language)) }
    }

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
}
