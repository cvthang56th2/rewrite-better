import SwiftUI

@MainActor
final class PanelViewModel: ObservableObject {
    @Published var mode: AppMode = .rewrite
    @Published var inputText = ""
    @Published var notes = ""
    @Published var resultText = ""
    @Published var statusMessage = ""
    @Published var isLoading = false
    @Published var copyFeedback = false

    // Rewrite
    @Published var tone = "friendly"
    @Published var enableTranslate = false
    @Published var fromLanguage = "auto"
    @Published var toLanguage = "en"

    // Format
    @Published var formatType = "markdown"

    // Reply
    @Published var channel = "message"
    @Published var intent = "general"
    @Published var replyTone = "professional"
    @Published var length = "medium"
    @Published var outputLanguage = "en"

    @Published var apiStatus: ApiStatus = .unknown

    enum ApiStatus {
        case unknown, ok, missing, invalid
    }

    var inputPlaceholder: String {
        mode == .reply
            ? "Paste received message to reply (or leave empty to compose)…"
            : "Paste or type text here…"
    }

    func syncInput(from controller: PanelController) {
        inputText = controller.inputText
        resultText = ""
        statusMessage = ""
        copyFeedback = false
        Task { await refreshApiStatus() }
    }

    func refreshApiStatus() async {
        apiStatus = SettingsStore.shared.hasAnyApiKey ? .ok : .missing
    }

    func process() async {
        resultText = ""
        statusMessage = ""
        copyFeedback = false

        if mode == .reply {
            if inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
               notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                statusMessage = "❌ Enter a received message and/or your notes."
                return
            }
        } else if inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            statusMessage = "❌ Vui lòng nhập văn bản cần xử lý."
            return
        }

        guard SettingsStore.shared.hasAnyApiKey else {
            statusMessage = LLMError.missingKey.localizedDescription
            return
        }

        let prompt: String?
        switch mode {
        case .rewrite:
            prompt = PromptBuilder.buildRewrite(
                input: inputText,
                tone: tone,
                translationEnabled: enableTranslate,
                fromLanguage: fromLanguage,
                toLanguage: toLanguage
            )
        case .format:
            prompt = PromptBuilder.buildFormat(formatType: formatType, input: inputText)
        case .reply:
            prompt = PromptBuilder.buildReply(
                channel: channel,
                intent: intent,
                tone: replyTone,
                length: length,
                outputLanguage: outputLanguage,
                incomingText: inputText,
                notes: notes
            )
        }

        guard let prompt else {
            statusMessage = "❌ Enter a received message and/or your notes."
            return
        }

        isLoading = true
        statusMessage = "⏳ Đang xử lý..."
        defer { isLoading = false }

        do {
            let text = try await LLMClient.shared.complete(prompt: prompt)
            resultText = text
            statusMessage = ""
            TextCaptureService.copyToClipboard(text)
            copyFeedback = true
        } catch {
            statusMessage = error.localizedDescription
            resultText = ""
        }
    }

    func copyResult() {
        guard !resultText.isEmpty else { return }
        TextCaptureService.copyToClipboard(resultText)
        copyFeedback = true
    }
}

struct PanelView: View {
    @EnvironmentObject private var panel: PanelController
    @StateObject private var vm = PanelViewModel()
    @StateObject private var inputAssist = WritingAssistController()
    @StateObject private var notesAssist = WritingAssistController()

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            header
            apiBanner

            // Always two columns; window min width guarantees this fits on Mac.
            twoColumnLayout
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .padding(16)
        .frame(minWidth: 720, idealWidth: 780, minHeight: 460, idealHeight: 540)
        .onAppear {
            vm.syncInput(from: panel)
        }
        .onChange(of: panel.inputText) { newValue in
            vm.inputText = newValue
            vm.resultText = ""
            vm.statusMessage = ""
            vm.copyFeedback = false
            inputAssist.dismissGhost()
        }
    }

    // MARK: - Layouts

    private var twoColumnLayout: some View {
        HStack(alignment: .top, spacing: 16) {
            leftColumn
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)

            Divider()

            rightColumn
                .frame(width: 300, alignment: .top)
                .frame(maxHeight: .infinity, alignment: .top)
        }
    }

    private var leftColumn: some View {
        VStack(alignment: .leading, spacing: 10) {
            inputSection
                .frame(maxHeight: vm.mode == .reply ? 140 : 200)

            if vm.mode == .reply {
                notesSection
                    .frame(height: 90)
            }

            writingAssistBar(
                assist: activeAssist,
                enabled: vm.mode == .reply ? $notesAssist.assistEnabled : $inputAssist.assistEnabled,
                text: activeTextBinding
            )

            actionRow

            statusAndResult
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
    }

    private var activeAssist: WritingAssistController {
        vm.mode == .reply ? notesAssist : inputAssist
    }

    private var activeTextBinding: Binding<String> {
        vm.mode == .reply ? $vm.notes : $vm.inputText
    }

    private var rightColumn: some View {
        VStack(alignment: .leading, spacing: 12) {
            modeSelector
            ScrollView(.vertical, showsIndicators: true) {
                modeOptions
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(maxHeight: .infinity)
        }
    }

    // MARK: - Sections

    private var header: some View {
        HStack {
            Text("Rewrite Better")
                .font(.title3.weight(.semibold))
            Spacer()
            Button {
                panel.openSettings()
            } label: {
                Image(systemName: "gearshape")
            }
            .buttonStyle(.borderless)
            .help("Settings")

            Button {
                panel.close()
            } label: {
                Image(systemName: "xmark")
            }
            .buttonStyle(.borderless)
            .help("Close")
        }
    }

    @ViewBuilder
    private var apiBanner: some View {
        VStack(alignment: .leading, spacing: 6) {
            if panel.needsAccessibility {
                VStack(alignment: .leading, spacing: 6) {
                    Text("⚠️ macOS chưa trust bản app đang chạy (thường do toggle đang gắn entry cũ).")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("1) Open Settings → Accessibility\n2) Xóa mọi “RewriteBetter” cũ → thêm lại / bật bản đang chạy\n3) Quit app hẳn rồi mở lại → Recheck")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(Bundle.main.bundleURL.path)
                        .font(.system(.caption2, design: .monospaced))
                        .textSelection(.enabled)
                        .foregroundStyle(.secondary)
                    HStack {
                        Button("Open Settings") {
                            TextCaptureService.openAccessibilitySettings()
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                        Button("Recheck") {
                            panel.refreshAccessibilityStatus()
                        }
                        .buttonStyle(.borderless)
                        .controlSize(.small)
                    }
                }
                .padding(8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.orange.opacity(0.12))
                .cornerRadius(8)
            }

            switch vm.apiStatus {
            case .ok:
                EmptyView()
            case .missing:
                HStack(spacing: 4) {
                    Text("⚠️ Chưa cấu hình API Key.")
                    Button("Cấu hình") { panel.openSettings() }
                        .buttonStyle(.link)
                }
                .font(.caption)
            case .invalid:
                HStack(spacing: 4) {
                    Text("⚠️ API Key có vấn đề.")
                    Button("Kiểm tra") { panel.openSettings() }
                        .buttonStyle(.link)
                }
                .font(.caption)
            case .unknown:
                EmptyView()
            }
        }
    }

    private var modeSelector: some View {
        Picker("Mode", selection: $vm.mode) {
            ForEach(AppMode.allCases) { mode in
                Text(mode.label).tag(mode)
            }
        }
        .pickerStyle(.segmented)
        .labelsHidden()
    }

    private var inputSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(vm.mode == .reply ? "Received message" : "Input")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                if vm.mode != .reply {
                    assistHint(inputAssist)
                }
            }
            GhostTextEditor(
                text: $vm.inputText,
                ghostText: $inputAssist.ghostText,
                onTextChange: { text, caretAtEnd in
                    // Full writing assist on input for rewrite/format; light assist on reply message too
                    inputAssist.textDidChange(text, caretAtEnd: caretAtEnd)
                }
            )
            .frame(minHeight: 100, maxHeight: .infinity)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.secondary.opacity(0.25)))
            .cornerRadius(8)
        }
    }

    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("Your notes (optional)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                assistHint(notesAssist)
            }
            GhostTextEditor(
                text: $vm.notes,
                ghostText: $notesAssist.ghostText,
                onTextChange: { text, caretAtEnd in
                    notesAssist.textDidChange(text, caretAtEnd: caretAtEnd)
                }
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.secondary.opacity(0.25)))
            .cornerRadius(8)
        }
    }

    private func assistHint(_ assist: WritingAssistController) -> some View {
        Group {
            if assist.isSuggesting {
                Text("Suggesting…")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            } else if !assist.ghostText.isEmpty {
                Text("Tab to accept · Esc to dismiss")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }

    @ViewBuilder
    private func writingAssistBar(
        assist: WritingAssistController,
        enabled: Binding<Bool>,
        text: Binding<String>
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Toggle("Writing assist", isOn: enabled)
                    .toggleStyle(.checkbox)
                    .font(.caption)
                Spacer()
                Button(assist.isChecking ? "Checking…" : "Check writing") {
                    Task { await assist.checkNow(text.wrappedValue) }
                }
                .disabled(assist.isChecking || text.wrappedValue.trimmingCharacters(in: .whitespacesAndNewlines).count < 12)
                .controlSize(.small)
            }

            if !assist.issues.isEmpty {
                Text("Suggestions")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                ForEach(assist.issues.prefix(6)) { issue in
                    HStack(alignment: .top, spacing: 8) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(issue.kind.rawValue.capitalized)
                                .font(.caption2.weight(.semibold))
                                .foregroundStyle(.orange)
                            Text(issue.message)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("“\(issue.original)” → “\(issue.replacement)”")
                                .font(.caption2)
                                .foregroundStyle(.primary)
                                .lineLimit(2)
                        }
                        Spacer(minLength: 0)
                        Button("Apply") {
                            var value = text.wrappedValue
                            assist.apply(issue: issue, to: &value)
                            text.wrappedValue = value
                        }
                        .controlSize(.small)
                        .buttonStyle(.bordered)
                    }
                    .padding(6)
                    .background(Color(nsColor: .controlBackgroundColor))
                    .cornerRadius(6)
                }
            }
        }
    }

    @ViewBuilder
    private var modeOptions: some View {
        switch vm.mode {
        case .rewrite:
            VStack(alignment: .leading, spacing: 10) {
                ChipGroup(title: "Tone", options: AppOptions.tones, selection: $vm.tone)
                Toggle("Enable Translation", isOn: $vm.enableTranslate)
                if vm.enableTranslate {
                    ChipGroup(title: "From", options: AppOptions.languages, selection: $vm.fromLanguage)
                    ChipGroup(title: "To", options: AppOptions.outputLanguages, selection: $vm.toLanguage)
                }
            }
        case .format:
            ChipGroup(title: "Format", options: AppOptions.formatTypes, selection: $vm.formatType)
        case .reply:
            VStack(alignment: .leading, spacing: 10) {
                ChipGroup(title: "Type", options: AppOptions.channels, selection: $vm.channel)
                ChipGroup(title: "Intent", options: AppOptions.intents, selection: $vm.intent)
                ChipGroup(title: "Tone", options: AppOptions.tones, selection: $vm.replyTone)
                ChipGroup(title: "Length", options: AppOptions.lengths, selection: $vm.length)
                ChipGroup(title: "Language", options: AppOptions.outputLanguages, selection: $vm.outputLanguage)
                Text("Leave message empty and use notes to compose new.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var actionRow: some View {
        HStack(spacing: 8) {
            Button(vm.mode.buttonLabel) {
                Task { await vm.process() }
            }
            .keyboardShortcut(.return, modifiers: .command)
            .disabled(vm.isLoading)
            .buttonStyle(.borderedProminent)

            if !vm.resultText.isEmpty {
                Button(vm.copyFeedback ? "✅ Copied" : "📋 Copy") {
                    vm.copyResult()
                }
            }
            Spacer(minLength: 0)
        }
    }

    @ViewBuilder
    private var statusAndResult: some View {
        VStack(alignment: .leading, spacing: 8) {
            if !vm.statusMessage.isEmpty {
                Text(vm.statusMessage)
                    .font(.callout)
                    .foregroundStyle(vm.statusMessage.hasPrefix("❌") ? .red : .secondary)
                    .textSelection(.enabled)
            }

            if !vm.resultText.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Result")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    ScrollView {
                        Text(vm.resultText)
                            .font(.body)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .textSelection(.enabled)
                            .padding(8)
                    }
                    .frame(minHeight: 80, maxHeight: .infinity)
                    .background(Color(nsColor: .textBackgroundColor))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.secondary.opacity(0.25)))
                    .cornerRadius(8)
                }
            } else if vm.statusMessage.isEmpty {
                Text("Result will appear here. ⌘↩ to run.")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    .padding(.top, 4)
            }
        }
    }
}
