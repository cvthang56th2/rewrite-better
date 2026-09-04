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

    private let client = GroqClient()

    func syncInput(from controller: PanelController) {
        inputText = controller.inputText
        resultText = ""
        statusMessage = ""
        copyFeedback = false
        Task { await refreshApiStatus() }
    }

    func refreshApiStatus() async {
        // Avoid hitting Groq on every open; full test lives in Settings.
        guard let key = SettingsStore.shared.apiKey, key.hasPrefix("gsk_") else {
            apiStatus = .missing
            return
        }
        apiStatus = .ok
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

        guard let apiKey = SettingsStore.shared.apiKey, !apiKey.isEmpty else {
            statusMessage = GroqError.missingKey.localizedDescription
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
            let text = try await client.complete(prompt: prompt, apiKey: apiKey)
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

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 8)

            ScrollView(.vertical, showsIndicators: true) {
                VStack(alignment: .leading, spacing: 12) {
                    apiBanner

                    TextEditor(text: $vm.inputText)
                        .font(.body)
                        .frame(height: 100)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.secondary.opacity(0.25)))

                    modeSelector

                    Group {
                        switch vm.mode {
                        case .rewrite: rewriteOptions
                        case .format: formatOptions
                        case .reply: replyOptions
                        }
                    }

                    HStack {
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
                    }

                    if !vm.statusMessage.isEmpty {
                        Text(vm.statusMessage)
                            .font(.callout)
                            .foregroundStyle(vm.statusMessage.hasPrefix("❌") ? .red : .secondary)
                            .textSelection(.enabled)
                    }

                    if !vm.resultText.isEmpty {
                        Text(vm.resultText)
                            .font(.body)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .textSelection(.enabled)
                            .padding(8)
                            .background(Color(nsColor: .textBackgroundColor))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.secondary.opacity(0.25)))
                            .cornerRadius(8)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .frame(minWidth: 380, minHeight: 480)
        .onAppear {
            vm.syncInput(from: panel)
        }
        .onChange(of: panel.inputText) { newValue in
            vm.inputText = newValue
            vm.resultText = ""
            vm.statusMessage = ""
            vm.copyFeedback = false
        }
    }

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
        switch vm.apiStatus {
        case .ok:
            Text("✅ Groq API Key hoạt động bình thường")
                .font(.caption)
                .foregroundStyle(.green)
        case .missing:
            HStack(spacing: 4) {
                Text("⚠️ Chưa cấu hình Groq API Key.")
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

    private var modeSelector: some View {
        HStack(spacing: 8) {
            ForEach(AppMode.allCases) { mode in
                Button(mode.label) {
                    vm.mode = mode
                }
                .buttonStyle(.bordered)
                .tint(vm.mode == mode ? .accentColor : .secondary)
            }
        }
    }

    private var rewriteOptions: some View {
        VStack(alignment: .leading, spacing: 10) {
            ChipGroup(title: "Tone", options: AppOptions.tones, selection: $vm.tone)
            Toggle("Enable Translation", isOn: $vm.enableTranslate)
            if vm.enableTranslate {
                ChipGroup(title: "From", options: AppOptions.languages, selection: $vm.fromLanguage)
                ChipGroup(title: "To", options: AppOptions.outputLanguages, selection: $vm.toLanguage)
            }
        }
    }

    private var formatOptions: some View {
        ChipGroup(title: "Format", options: AppOptions.formatTypes, selection: $vm.formatType)
    }

    private var replyOptions: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Your notes (optional)")
                .font(.caption)
                .foregroundStyle(.secondary)
            TextEditor(text: $vm.notes)
                .font(.body)
                .frame(height: 56)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.secondary.opacity(0.25)))

            ChipGroup(title: "Type", options: AppOptions.channels, selection: $vm.channel)
            ChipGroup(title: "Intent", options: AppOptions.intents, selection: $vm.intent)
            ChipGroup(title: "Tone", options: AppOptions.tones, selection: $vm.replyTone)
            ChipGroup(title: "Length", options: AppOptions.lengths, selection: $vm.length)
            ChipGroup(title: "Language", options: AppOptions.outputLanguages, selection: $vm.outputLanguage)

            Text("Paste the received message above to reply, or leave it empty and use notes to compose new.")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}
