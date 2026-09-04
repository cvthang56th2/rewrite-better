import Foundation

struct WritingIssue: Identifiable, Equatable {
    let id: UUID
    let kind: Kind
    let message: String
    let original: String
    let replacement: String

    enum Kind: String, Equatable {
        case grammar
        case spelling
        case tone
        case clarity
    }

    init(id: UUID = UUID(), kind: Kind, message: String, original: String, replacement: String) {
        self.id = id
        self.kind = kind
        self.message = message
        self.original = original
        self.replacement = replacement
    }
}
