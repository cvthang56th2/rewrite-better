import AppKit
import SwiftUI

/// NSTextView wrapper with Cursor-like ghost text (Tab to accept, Esc to dismiss).
struct GhostTextEditor: NSViewRepresentable {
    @Binding var text: String
    @Binding var ghostText: String
    var onTextChange: (_ text: String, _ caretAtEnd: Bool) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> NSScrollView {
        let scroll = NSScrollView()
        scroll.hasVerticalScroller = true
        scroll.hasHorizontalScroller = false
        scroll.borderType = .noBorder
        scroll.drawsBackground = false

        let textView = GhostCapableTextView()
        textView.delegate = context.coordinator
        textView.isRichText = false
        textView.allowsUndo = true
        textView.font = .systemFont(ofSize: NSFont.systemFontSize)
        textView.textColor = .labelColor
        textView.backgroundColor = .textBackgroundColor
        textView.isHorizontallyResizable = false
        textView.isVerticallyResizable = true
        textView.autoresizingMask = [.width]
        textView.textContainer?.containerSize = NSSize(width: scroll.contentSize.width, height: CGFloat.greatestFiniteMagnitude)
        textView.textContainer?.widthTracksTextView = true
        textView.textContainerInset = NSSize(width: 6, height: 6)
        textView.string = text
        textView.ghostText = ghostText
        textView.onAcceptGhost = { [weak tv = textView, weak coordinator = context.coordinator] in
            guard let tv, let coordinator else { return }
            let ghost = tv.ghostText
            guard !ghost.isEmpty else { return }
            tv.ghostText = ""
            tv.insertText(ghost, replacementRange: tv.selectedRange())
            coordinator.parent.text = tv.string
            coordinator.parent.ghostText = ""
            coordinator.parent.onTextChange(tv.string, Self.isCaretAtEnd(tv))
        }
        textView.onDismissGhost = { [weak tv = textView, weak coordinator = context.coordinator] in
            tv?.ghostText = ""
            coordinator?.parent.ghostText = ""
        }

        scroll.documentView = textView
        context.coordinator.textView = textView
        return scroll
    }

    func updateNSView(_ scroll: NSScrollView, context: Context) {
        context.coordinator.parent = self
        guard let textView = context.coordinator.textView else { return }

        if textView.string != text {
            let selected = textView.selectedRange()
            textView.string = text
            let max = (text as NSString).length
            textView.setSelectedRange(NSRange(location: min(selected.location, max), length: 0))
        }
        if textView.ghostText != ghostText {
            textView.ghostText = ghostText
        }
    }

    static func isCaretAtEnd(_ textView: NSTextView) -> Bool {
        let sel = textView.selectedRange()
        return sel.length == 0 && sel.location == (textView.string as NSString).length
    }

    final class Coordinator: NSObject, NSTextViewDelegate {
        var parent: GhostTextEditor
        weak var textView: GhostCapableTextView?

        init(_ parent: GhostTextEditor) {
            self.parent = parent
        }

        func textDidChange(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            parent.text = textView.string
            parent.ghostText = ""
            parent.onTextChange(textView.string, GhostTextEditor.isCaretAtEnd(textView))
        }

        func textViewDidChangeSelection(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            if !GhostTextEditor.isCaretAtEnd(textView) {
                parent.ghostText = ""
            }
        }
    }
}

final class GhostCapableTextView: NSTextView {
    var ghostText: String = "" {
        didSet {
            if oldValue != ghostText {
                needsDisplay = true
            }
        }
    }

    var onAcceptGhost: (() -> Void)?
    var onDismissGhost: (() -> Void)?

    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)
        drawGhostTextIfNeeded()
    }

    private func drawGhostTextIfNeeded() {
        guard !ghostText.isEmpty,
              let layoutManager,
              let textContainer else { return }

        let sel = selectedRange()
        guard sel.length == 0 else { return }

        let glyphIndex = min(sel.location, layoutManager.numberOfGlyphs)
        var rect = layoutManager.boundingRect(
            forGlyphRange: NSRange(location: max(glyphIndex, 0), length: 0),
            in: textContainer
        )
        let origin = textContainerOrigin
        rect.origin.x += origin.x
        rect.origin.y += origin.y

        if string.isEmpty {
            rect.origin = NSPoint(x: textContainerInset.width, y: textContainerInset.height)
        }

        let attrs: [NSAttributedString.Key: Any] = [
            .foregroundColor: NSColor.secondaryLabelColor.withAlphaComponent(0.5),
            .font: font ?? NSFont.systemFont(ofSize: NSFont.systemFontSize)
        ]
        (ghostText as NSString).draw(at: rect.origin, withAttributes: attrs)
    }

    override func keyDown(with event: NSEvent) {
        if event.keyCode == 48, !ghostText.isEmpty {
            onAcceptGhost?()
            return
        }
        if event.keyCode == 53, !ghostText.isEmpty {
            onDismissGhost?()
            return
        }
        super.keyDown(with: event)
    }

    override func insertTab(_ sender: Any?) {
        if !ghostText.isEmpty {
            onAcceptGhost?()
        } else {
            super.insertTab(sender)
        }
    }

    override func cancelOperation(_ sender: Any?) {
        if !ghostText.isEmpty {
            onDismissGhost?()
        } else {
            super.cancelOperation(sender)
        }
    }
}
