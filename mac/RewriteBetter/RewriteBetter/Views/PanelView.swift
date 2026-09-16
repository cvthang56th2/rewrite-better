import SwiftUI

@MainActor
final class PanelViewModel: ObservableObject {
    @Published var mode: AppMode = .rewrite
    @Published var inputText = ""
    @Published var notes = ""
    @Published var resultText = ""
    @Published var variants: [String] = []
    @Published var variantIndex = 0
    @Published var diffSource = ""
    @Published var statusMessage = ""
    @Published var isLoading = false
    @Published var copyFeedback = false
    @Published var statusKind: StatusKind = .info

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

    enum StatusKind {
        case info, error
    }

    var inputPlaceholder: String {
        LanguageStore.shared.t(mode == .reply ? "panel.placeholder.reply" : "panel.placeholder.input")
    }

    func syncInput(from controller: PanelController) {
        inputText = controller.inputText
        resultText = ""
        variants = []
        variantIndex = 0
        diffSource = ""
        statusMessage = ""
        statusKind = .info
        copyFeedback = false
        Task { await refreshApiStatus() }
    }

    func refreshApiStatus() async {
        apiStatus = SettingsStore.shared.hasAnyApiKey ? .ok : .missing
    }

    func process() async {
        resultText = ""
        variants = []
        variantIndex = 0
        diffSource = ""
        statusMessage = ""
        statusKind = .info
        copyFeedback = false

        if mode == .reply {
            if inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
               notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                statusKind = .error
                statusMessage = LanguageStore.shared.t("panel.emptyReply")
                return
            }
        } else if inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            statusKind = .error
            statusMessage = LanguageStore.shared.t("panel.emptyInput")
            return
        }

        guard SettingsStore.shared.hasAnyApiKey else {
            statusKind = .error
            statusMessage = LLMError.missingKey.localizedDescription
            return
        }

        let extra = SettingsStore.shared.extraInstructions(for: mode)
        let voice = SettingsStore.shared.voiceSamples
        let prompt: String?
        switch mode {
        case .rewrite:
            prompt = PromptBuilder.buildRewrite(
                input: inputText,
                tone: tone,
                translationEnabled: enableTranslate,
                fromLanguage: fromLanguage,
                toLanguage: toLanguage,
                extraInstructions: extra,
                voiceSamples: voice
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
                extraInstructions: extra,
                voiceSamples: voice
            )
        }

        guard let prompt else {
            statusKind = .error
            statusMessage = LanguageStore.shared.t("panel.emptyReply")
            return
        }

        isLoading = true
        statusKind = .info
        statusMessage = LanguageStore.shared.t("panel.processing")
        defer { isLoading = false }

        do {
            let text = try await LLMClient.shared.complete(prompt: prompt)
            let parsed = mode == .format ? [text].filter { !$0.isEmpty } : ResultDiff.parseVariants(text)
            guard !parsed.isEmpty else {
                statusKind = .error
                statusMessage = LanguageStore.shared.t("panel.emptyResponse")
                return
            }
            variants = parsed
            variantIndex = 0
            resultText = parsed[0]
            diffSource = mode == .rewrite ? inputText : ""
            statusMessage = ""
            TextCaptureService.copyToClipboard(resultText)
            copyFeedback = true
        } catch {
            statusKind = .error
            statusMessage = error.localizedDescription
            resultText = ""
            variants = []
            variantIndex = 0
            diffSource = ""
        }
    }

    func selectVariant(_ index: Int) {
        guard variants.indices.contains(index) else { return }
        variantIndex = index
        resultText = variants[index]
        copyFeedback = false
    }

    var diffParts: [DiffOp] {
        guard !diffSource.isEmpty, !resultText.isEmpty else { return [] }
        return ResultDiff.diffWords(original: diffSource, next: resultText)
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
            statusKind = .info
        case .noTarget:
            statusKind = .error
            statusMessage = LanguageStore.shared.t("panel.pasteNoTarget")
        case .emptyText:
            break
        case .activateFailed:
            statusKind = .error
            statusMessage = LanguageStore.shared.t("panel.pasteActivateFailed")
        }
    }
}

struct PanelView: View {
    @EnvironmentObject private var panel: PanelController
    @ObservedObject private var lang = LanguageStore.shared
    @ObservedObject private var hotkeys = HotkeyService.shared
    @StateObject private var vm = PanelViewModel()
    @StateObject private var inputAssist = WritingAssistController()
    @StateObject private var notesAssist = WritingAssistController()

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            header
            modeSelector
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
            vm.statusKind = .info
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
        ScrollView(.vertical, showsIndicators: true) {
            VStack(alignment: .leading, spacing: 10) {
                inputSection
                    .frame(minHeight: vm.mode == .reply ? 100 : 120, maxHeight: vm.mode == .reply ? 140 : 200)
                    .clipped()

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
            }
            .frame(maxWidth: .infinity, alignment: .topLeading)
            .padding(.trailing, 2)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }

    private var activeAssist: WritingAssistController {
        vm.mode == .reply ? notesAssist : inputAssist
    }

    private var activeTextBinding: Binding<String> {
        vm.mode == .reply ? $vm.notes : $vm.inputText
    }

    private var rightColumn: some View {
        ScrollView(.vertical, showsIndicators: true) {
            modeOptions
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxHeight: .infinity)
    }

    // MARK: - Sections

    private var header: some View {
        HStack(spacing: 10) {
            Text(hotkeys.current.displayString)
                .font(.caption.weight(.medium).monospacedDigit())
                .padding(.horizontal, 8)
                .padding(.vertical, 5)
                .background(Capsule().fill(Theme.fill))
                .overlay(Capsule().stroke(Theme.line))
                .accessibilityLabel(lang.t("settings.shortcut"))
                .accessibilityValue(hotkeys.current.displayString)
            Spacer()
            Button {
                panel.openSettings()
            } label: {
                Image(systemName: "gearshape")
                    .frame(minWidth: Theme.controlMin, minHeight: Theme.controlMin)
            }
            .buttonStyle(.borderless)
            .help(lang.t("panel.settings"))
            .accessibilityLabel(lang.t("panel.settings"))
        }
    }

    @ViewBuilder
    private var apiBanner: some View {
        VStack(alignment: .leading, spacing: 8) {
            if panel.needsAccessibility {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "hand.raised.fill")
                            .foregroundStyle(.orange)
                            .accessibilityHidden(true)
                        Text(lang.t("a11y.untrusted"))
                            .font(.callout)
                    }
                    HStack(spacing: 8) {
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
                    DisclosureGroup(lang.t("a11y.details")) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(lang.t("a11y.steps"))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(Bundle.main.bundleURL.path)
                                .font(.system(.caption2, design: .monospaced))
                                .textSelection(.enabled)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .font(.caption)
                }
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.warningFill)
                .cornerRadius(Theme.radius)
            }

            switch vm.apiStatus {
            case .ok, .unknown:
                EmptyView()
            case .missing:
                HStack(spacing: 8) {
                    Image(systemName: "key.fill")
                        .foregroundStyle(.secondary)
                        .accessibilityHidden(true)
                    Text(lang.t("api.missing"))
                    Button(lang.t("api.configure")) { panel.openSettings() }
                        .buttonStyle(.link)
                }
                .font(.callout)
            case .invalid:
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                        .accessibilityHidden(true)
                    Text(lang.t("api.invalid"))
                    Button(lang.t("api.check")) { panel.openSettings() }
                        .buttonStyle(.link)
                }
                .font(.callout)
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
        .frame(maxWidth: .infinity)
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
                placeholder: vm.inputPlaceholder,
                onTextChange: { text, caretAtEnd in
                    // Full writing assist on input for rewrite/format; light assist on reply message too
                    inputAssist.textDidChange(text, caretAtEnd: caretAtEnd)
                }
            )
            .frame(minHeight: 100, maxHeight: .infinity)
            .overlay(RoundedRectangle(cornerRadius: Theme.radius).stroke(Theme.line))
            .cornerRadius(Theme.radius)
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
                placeholder: lang.t("panel.placeholder.notes"),
                onTextChange: { text, caretAtEnd in
                    notesAssist.textDidChange(text, caretAtEnd: caretAtEnd)
                }
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .overlay(RoundedRectangle(cornerRadius: Theme.radius).stroke(Theme.line))
            .cornerRadius(Theme.radius)
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
                    .padding(8)
                    .background(Theme.fill)
                    .cornerRadius(8)
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
        let voice = SettingsStore.shared.voiceSamples
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if !extra.isEmpty {
            Text(lang.t("panel.extraHint"))
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        if !voice.isEmpty {
            Text(lang.t("panel.voiceHint"))
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private var actionRow: some View {
        HStack(spacing: 8) {
            Button {
                Task { await vm.process() }
            } label: {
                if vm.isLoading {
                    HStack(spacing: 8) {
                        ProgressView()
                            .controlSize(.small)
                        Text(lang.t("panel.processing"))
                    }
                } else {
                    Text(vm.mode.buttonLabel(lang.language))
                }
            }
            .keyboardShortcut(.return, modifiers: .command)
            .disabled(vm.isLoading)
            .buttonStyle(.borderedProminent)

            if !vm.resultText.isEmpty {
                Button {
                    vm.copyResult()
                } label: {
                    Label(
                        vm.copyFeedback ? lang.t("panel.copied") : lang.t("panel.copy"),
                        systemImage: vm.copyFeedback ? "checkmark" : "doc.on.doc"
                    )
                }

                if let target = panel.pasteBackTarget {
                    let name = target.appName ?? lang.t("paste.previousApp")
                    Button {
                        vm.pasteBack(using: panel)
                    } label: {
                        Label(
                            lang.t(target.hadSelection ? "paste.replaceIn" : "paste.pasteIn", name),
                            systemImage: "arrow.uturn.backward"
                        )
                    }
                    .keyboardShortcut(.return, modifiers: [.command, .option])
                    .help(lang.t(
                        target.hadSelection ? "paste.replaceHelp" : "paste.pasteHelp",
                        name
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
                    .foregroundStyle(vm.statusKind == .error ? Color.red : .secondary)
                    .textSelection(.enabled)
                    .accessibilityAddTraits(.updatesFrequently)
            }

            if !vm.resultText.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text(lang.t("panel.result"))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if vm.variants.count > 1 {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(lang.t("panel.variants"))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            LazyVGrid(
                                columns: [GridItem(.adaptive(minimum: 88), spacing: 6)],
                                alignment: .leading,
                                spacing: 6
                            ) {
                                ForEach(Array(vm.variants.indices), id: \.self) { index in
                                    Button(lang.t("panel.variant", "\(index + 1)")) {
                                        vm.selectVariant(index)
                                    }
                                    .buttonStyle(.bordered)
                                    .tint(index == vm.variantIndex ? .accentColor : .secondary)
                                    .controlSize(.small)
                                    .frame(maxWidth: .infinity)
                                }
                            }
                        }
                    }
                    Text(vm.resultText)
                        .font(.body)
                        .frame(maxWidth: .infinity, minHeight: 80, alignment: .topLeading)
                        .textSelection(.enabled)
                        .padding(8)
                        .background(Theme.editor)
                        .overlay(RoundedRectangle(cornerRadius: Theme.radius).stroke(Theme.line))
                        .cornerRadius(Theme.radius)

                    if ResultDiff.hasVisibleDiff(vm.diffParts) {
                        HStack(spacing: 6) {
                            Image(systemName: "text.redaction")
                                .foregroundStyle(.secondary)
                                .accessibilityHidden(true)
                            Text(lang.t("panel.changes"))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Text(diffAttributed(vm.diffParts))
                            .font(.callout)
                            .frame(maxWidth: .infinity, alignment: .topLeading)
                            .textSelection(.enabled)
                            .padding(8)
                            .background(Theme.editor)
                            .overlay(RoundedRectangle(cornerRadius: Theme.radius).stroke(Theme.line))
                            .cornerRadius(Theme.radius)
                    }
                }
            } else if vm.statusMessage.isEmpty {
                Text(lang.t("panel.resultHint"))
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    .padding(.top, 4)
            }
        }
    }

    private func diffAttributed(_ parts: [DiffOp]) -> AttributedString {
        var result = AttributedString()
        for part in parts {
            var chunk = AttributedString(part.text)
            switch part {
            case .equal:
                break
            case .delete:
                chunk.strikethroughStyle = .single
                chunk.backgroundColor = Theme.deleteFill
            case .insert:
                chunk.backgroundColor = Theme.insertFill
            }
            result += chunk
        }
        return result
    }
}
