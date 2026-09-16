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
        LanguageStore.shared.t(mode == .reply ? "panel.placeholder.reply" : "panel.placeholder.input")
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
                statusMessage = LanguageStore.shared.t("panel.emptyReply")
                return
            }
        } else if inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            statusMessage = LanguageStore.shared.t("panel.emptyInput")
            return
        }

        guard SettingsStore.shared.hasAnyApiKey else {
            statusMessage = LLMError.missingKey.localizedDescription
            return
        }

        let extra = SettingsStore.shared.extraInstructions(for: mode)
        let prompt: String?
        switch mode {
        case .rewrite:
            prompt = PromptBuilder.buildRewrite(
                input: inputText,
                tone: tone,
                translationEnabled: enableTranslate,
                fromLanguage: fromLanguage,
                toLanguage: toLanguage,
                extraInstructions: extra
            )
        case .format:
            prompt = PromptBuilder.buildFormat(
                formatType: formatType,
                input: inputText,
                extraInstructions: extra
            )
        case .reply:
            prompt = PromptBuilder.buildReply(
                channel: channel,
                intent: intent,
                tone: replyTone,
                length: length,
                outputLanguage: outputLanguage,
                incomingText: inputText,
                notes: notes,
                extraInstructions: extra
            )
        }

        guard let prompt else {
            statusMessage = LanguageStore.shared.t("panel.emptyReply")
            return
        }

        isLoading = true
        statusMessage = LanguageStore.shared.t("panel.processing")
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

    func pasteBack(using panel: PanelController) {
        switch panel.pasteBack(text: resultText) {
        case .replacedViaAccessibility, .replacedViaPaste:
            statusMessage = ""
        case .noTarget:
            statusMessage = LanguageStore.shared.t("panel.pasteNoTarget")
        case .emptyText:
            break
        case .activateFailed:
            statusMessage = LanguageStore.shared.t("panel.pasteActivateFailed")
        }
    }
}

struct PanelView: View {
    @EnvironmentObject private var panel: PanelController
    @ObservedObject private var lang = LanguageStore.shared
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
            Text(lang.t("panel.title"))
                .font(.title3.weight(.semibold))
            Spacer()
            Button {
                panel.openSettings()
            } label: {
                Image(systemName: "gearshape")
            }
            .buttonStyle(.borderless)
            .help(lang.t("panel.settings"))

            Button {
                panel.close()
            } label: {
                Image(systemName: "xmark")
            }
            .buttonStyle(.borderless)
            .help(lang.t("panel.close"))
        }
    }

    @ViewBuilder
    private var apiBanner: some View {
        VStack(alignment: .leading, spacing: 6) {
            if panel.needsAccessibility {
                VStack(alignment: .leading, spacing: 6) {
                    Text(lang.t("a11y.untrusted"))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(lang.t("a11y.steps"))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(Bundle.main.bundleURL.path)
                        .font(.system(.caption2, design: .monospaced))
                        .textSelection(.enabled)
                        .foregroundStyle(.secondary)
                    HStack {
                        Button(lang.t("a11y.openSettings")) {
                            TextCaptureService.openAccessibilitySettings()
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                        Button(lang.t("a11y.recheck")) {
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
                    Text(lang.t("api.missing"))
                    Button(lang.t("api.configure")) { panel.openSettings() }
                        .buttonStyle(.link)
                }
                .font(.caption)
            case .invalid:
                HStack(spacing: 4) {
                    Text(lang.t("api.invalid"))
                    Button(lang.t("api.check")) { panel.openSettings() }
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
                Text(mode.label(lang.language)).tag(mode)
            }
        }
        .pickerStyle(.segmented)
        .labelsHidden()
    }

    private var inputSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(lang.t(vm.mode == .reply ? "panel.receivedMessage" : "panel.input"))
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
                Text(lang.t("panel.notes"))
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
                Text(lang.t("panel.suggesting"))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            } else if !assist.ghostText.isEmpty {
                Text(lang.t("panel.tabHint"))
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
                Toggle(lang.t("panel.writingAssist"), isOn: enabled)
                    .toggleStyle(.checkbox)
                    .font(.caption)
                Spacer()
                Button(assist.isChecking ? lang.t("panel.checking") : lang.t("panel.checkWriting")) {
                    Task { await assist.checkNow(text.wrappedValue) }
                }
                .disabled(assist.isChecking || text.wrappedValue.trimmingCharacters(in: .whitespacesAndNewlines).count < 12)
                .controlSize(.small)
            }

            if !assist.issues.isEmpty {
                Text(lang.t("panel.suggestions"))
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
                        Button(lang.t("panel.apply")) {
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
                ChipGroup(title: lang.t("panel.tone"), options: AppOptions.tones(lang.language), selection: $vm.tone)
                Toggle(lang.t("panel.enableTranslation"), isOn: $vm.enableTranslate)
                if vm.enableTranslate {
                    ChipGroup(title: lang.t("panel.from"), options: AppOptions.languages, selection: $vm.fromLanguage)
                    ChipGroup(title: lang.t("panel.to"), options: AppOptions.outputLanguages, selection: $vm.toLanguage)
                }
                extraInstructionsHint
            }
        case .format:
            VStack(alignment: .leading, spacing: 10) {
                ChipGroup(title: lang.t("panel.format"), options: AppOptions.formatTypes(lang.language), selection: $vm.formatType)
                extraInstructionsHint
            }
        case .reply:
            VStack(alignment: .leading, spacing: 10) {
                ChipGroup(title: lang.t("panel.type"), options: AppOptions.channels(lang.language), selection: $vm.channel)
                ChipGroup(title: lang.t("panel.intent"), options: AppOptions.intents(lang.language), selection: $vm.intent)
                ChipGroup(title: lang.t("panel.tone"), options: AppOptions.tones(lang.language), selection: $vm.replyTone)
                ChipGroup(title: lang.t("panel.length"), options: AppOptions.lengths(lang.language), selection: $vm.length)
                ChipGroup(title: lang.t("panel.language"), options: AppOptions.outputLanguages, selection: $vm.outputLanguage)
                Text(lang.t("panel.replyHint"))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                extraInstructionsHint
            }
        }
    }

    @ViewBuilder
    private var extraInstructionsHint: some View {
        let extra = SettingsStore.shared.extraInstructions(for: vm.mode)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if !extra.isEmpty {
            Text(lang.t("panel.extraHint"))
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private var actionRow: some View {
        HStack(spacing: 8) {
            Button(vm.mode.buttonLabel(lang.language)) {
                Task { await vm.process() }
            }
            .keyboardShortcut(.return, modifiers: .command)
            .disabled(vm.isLoading)
            .buttonStyle(.borderedProminent)

            if !vm.resultText.isEmpty {
                Button(vm.copyFeedback ? lang.t("panel.copied") : lang.t("panel.copy")) {
                    vm.copyResult()
                }

                if let target = panel.pasteBackTarget {
                    Button(lang.t(target.hadSelection ? "paste.replace" : "paste.paste")) {
                        vm.pasteBack(using: panel)
                    }
                    .keyboardShortcut(.return, modifiers: [.command, .option])
                    .help(lang.t(
                        target.hadSelection ? "paste.replaceHelp" : "paste.pasteHelp",
                        target.appName ?? lang.t("paste.previousApp")
                    ))
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
                    Text(lang.t("panel.result"))
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
                Text(lang.t("panel.resultHint"))
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    .padding(.top, 4)
            }
        }
    }
}
