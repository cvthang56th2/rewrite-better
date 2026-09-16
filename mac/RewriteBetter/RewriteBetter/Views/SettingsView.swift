import AppKit
import SwiftUI

struct SettingsView: View {
    @State private var geminiKeys = SettingsStore.shared.keys(for: .gemini)
    @State private var groqKeys = SettingsStore.shared.keys(for: .groq)
    @State private var cerebrasKeys = SettingsStore.shared.keys(for: .cerebras)
    @State private var openaiKeys = SettingsStore.shared.keys(for: .openai)
    @State private var message = ""
    @State private var keyTestResults: [LLMClient.KeyTestResult] = []
    @State private var isTesting = false
    @State private var launchAtLogin = LaunchAtLogin.isEnabled
    @State private var launchAtLoginError = ""
    @ObservedObject private var hotkeys = HotkeyService.shared
    @ObservedObject private var lang = LanguageStore.shared
    @State private var rewriteExtra = ""
    @State private var formatExtra = ""
    @State private var replyExtra = ""
    @State private var voiceSamples = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Text(lang.t("settings.language"))
                            .font(.subheadline.weight(.medium))
                        Spacer()
                        Picker(lang.t("settings.language"), selection: $lang.language) {
                            ForEach(AppLanguage.allCases) { language in
                                Text(language.displayName).tag(language)
                            }
                        }
                        .pickerStyle(.segmented)
                        .labelsHidden()
                        .frame(maxWidth: 240)
                    }
                }

                Divider()

                VStack(alignment: .leading, spacing: 10) {
                    Text(lang.t("settings.failoverOrder"))
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    ProviderKeyField(provider: .gemini, text: $geminiKeys)
                    ProviderKeyField(provider: .groq, text: $groqKeys)
                    ProviderKeyField(provider: .cerebras, text: $cerebrasKeys)
                    ProviderKeyField(provider: .openai, text: $openaiKeys)

                    APIKeyDisclaimer()
                }

                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    Toggle(lang.t("settings.openAtLogin"), isOn: $launchAtLogin)
                        .onChange(of: launchAtLogin) { newValue in
                            do {
                                _ = try LaunchAtLogin.setEnabled(newValue)
                                launchAtLogin = LaunchAtLogin.isEnabled
                                launchAtLoginError = ""
                                message = lang.t(newValue ? "settings.openAtLoginOn" : "settings.openAtLoginOff")
                            } catch {
                                launchAtLogin = LaunchAtLogin.isEnabled
                                launchAtLoginError = error.localizedDescription
                                message = lang.t("settings.openAtLoginFail")
                            }
                        }

                    Text(lang.t("settings.openAtLoginHelp"))
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if !launchAtLoginError.isEmpty {
                        Text(launchAtLoginError)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }

                    HStack(spacing: 8) {
                        Text(lang.t("settings.shortcut"))
                            .font(.subheadline.weight(.medium))
                        Spacer()
                        if hotkeys.current != .default {
                            Button(lang.t("settings.reset")) {
                                applyHotkey(.default)
                            }
                            .controlSize(.small)
                        }
                        HotkeyRecorderButton(hotkey: hotkeys.current) { shortcut in
                            applyHotkey(shortcut)
                        }
                    }

                    Text(lang.t("settings.shortcutHelp"))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Divider()

                VStack(alignment: .leading, spacing: 10) {
                    Text(lang.t("settings.extraTitle"))
                        .font(.headline)

                    Text(lang.t("settings.extraHelp"))
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    ExtraInstructionsEditor(
                        title: lang.t("mode.rewrite"),
                        text: $rewriteExtra,
                        placeholder: lang.t("settings.extraRewritePlaceholder")
                    )
                    ExtraInstructionsEditor(
                        title: lang.t("mode.format"),
                        text: $formatExtra,
                        placeholder: lang.t("settings.extraFormatPlaceholder")
                    )
                    ExtraInstructionsEditor(
                        title: lang.t("mode.reply"),
                        text: $replyExtra,
                        placeholder: lang.t("settings.extraReplyPlaceholder")
                    )
                }

                Divider()

                VStack(alignment: .leading, spacing: 10) {
                    Text(lang.t("settings.voiceTitle"))
                        .font(.headline)

                    Text(lang.t("settings.voiceHelp"))
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    ExtraInstructionsEditor(
                        title: lang.t("settings.voiceTitle"),
                        text: $voiceSamples,
                        placeholder: lang.t("settings.voicePlaceholder"),
                        minHeight: 96,
                        maxHeight: 160
                    )
                }

                Divider()

                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Button(lang.t("settings.save")) {
                            saveKeys()
                            message = lang.t("settings.saved")
                        }
                        .keyboardShortcut(.defaultAction)

                        Button(lang.t("settings.testKeys")) {
                            Task { await testKeys() }
                        }
                        .disabled(isTesting || !hasAnyDraftKey)

                        Spacer()
                    }

                    HStack {
                        Button(lang.t("settings.openAccessibility")) {
                            TextCaptureService.openAccessibilitySettings()
                        }

                        Button(lang.t("settings.privacy")) {
                            PanelController.shared.openPrivacy()
                        }

                        Button(lang.t("onboarding.showAgain")) {
                            PanelController.shared.openWelcome()
                        }
                    }

                    if !message.isEmpty {
                        Text(message)
                            .font(.callout)
                            .textSelection(.enabled)
                    }

                    if !keyTestResults.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            ForEach(keyTestResults) { result in
                                VStack(alignment: .leading, spacing: 2) {
                                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                                        Text(result.ok ? "✅" : "❌")
                                        Text("\(result.provider) \(result.id)")
                                            .fontWeight(.medium)
                                        Text("(\(result.keyHint))")
                                            .foregroundStyle(.secondary)
                                            .font(.system(.caption, design: .monospaced))
                                    }
                                    if !result.ok {
                                        Text(result.detail)
                                            .font(.caption)
                                            .foregroundStyle(.red)
                                            .textSelection(.enabled)
                                    }
                                }
                            }
                        }
                    }

                    Text(lang.t("settings.accessibilityFooter", hotkeys.current.displayString))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(minWidth: 520, idealWidth: 560, minHeight: 400, idealHeight: 640)
        .onAppear {
            launchAtLogin = LaunchAtLogin.isEnabled
            geminiKeys = SettingsStore.shared.keys(for: .gemini)
            groqKeys = SettingsStore.shared.keys(for: .groq)
            cerebrasKeys = SettingsStore.shared.keys(for: .cerebras)
            openaiKeys = SettingsStore.shared.keys(for: .openai)
            rewriteExtra = SettingsStore.shared.extraInstructions(for: .rewrite)
            formatExtra = SettingsStore.shared.extraInstructions(for: .format)
            replyExtra = SettingsStore.shared.extraInstructions(for: .reply)
            voiceSamples = SettingsStore.shared.voiceSamples
            NSApp.keyWindow?.title = lang.t("settings.windowTitle")
        }
        .onChange(of: lang.language) { _ in
            NSApp.keyWindow?.title = lang.t("settings.windowTitle")
        }
    }

    private var hasAnyDraftKey: Bool {
        [geminiKeys, groqKeys, cerebrasKeys, openaiKeys]
            .contains { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    }

    private func saveKeys() {
        SettingsStore.shared.setKeys(geminiKeys, for: .gemini)
        SettingsStore.shared.setKeys(groqKeys, for: .groq)
        SettingsStore.shared.setKeys(cerebrasKeys, for: .cerebras)
        SettingsStore.shared.setKeys(openaiKeys, for: .openai)
        SettingsStore.shared.setExtraInstructions(rewriteExtra, for: .rewrite)
        SettingsStore.shared.setExtraInstructions(formatExtra, for: .format)
        SettingsStore.shared.setExtraInstructions(replyExtra, for: .reply)
        SettingsStore.shared.voiceSamples = voiceSamples
    }

    private func applyHotkey(_ shortcut: PanelHotkey) {
        if HotkeyService.shared.apply(shortcut) {
            message = lang.t("settings.shortcutSet", shortcut.displayString)
        } else {
            message = lang.t("settings.shortcutFail", shortcut.displayString)
        }
    }

    private func testKeys() async {
        isTesting = true
        defer { isTesting = false }
        saveKeys()
        keyTestResults = []
        message = lang.t("settings.testing")

        let results = await LLMClient.shared.testAllKeys()
        keyTestResults = results

        guard !results.isEmpty else {
            message = LLMError.missingKey.localizedDescription
            return
        }

        let okCount = results.filter(\.ok).count
        let failCount = results.count - okCount
        if failCount == 0 {
            message = lang.t("settings.allKeysOk", "\(okCount)")
        } else if okCount == 0 {
            message = lang.t("settings.allKeysFailed", "\(failCount)")
        } else {
            message = lang.t("settings.keysPartial", "\(okCount)", "\(failCount)")
        }
    }
}

private struct ExtraInstructionsEditor: View {
    let title: String
    @Binding var text: String
    let placeholder: String
    var minHeight: CGFloat = 56
    var maxHeight: CGFloat = 88

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.subheadline.weight(.medium))

            TextEditor(text: $text)
                .font(.system(.body))
                .frame(minHeight: minHeight, maxHeight: maxHeight)
                .overlay(alignment: .topLeading) {
                    if text.isEmpty {
                        Text(placeholder)
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                            .padding(.top, 8)
                            .padding(.leading, 5)
                            .allowsHitTesting(false)
                    }
                }
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(Color.secondary.opacity(0.25))
                )
        }
    }
}

private struct APIKeyDisclaimer: View {
    var showBackground = true
    @ObservedObject private var lang = LanguageStore.shared

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "lock.shield")
                .foregroundStyle(.secondary)
                .padding(.top, 1)

            Text(lang.t("settings.disclaimer"))
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(showBackground ? 10 : 0)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            if showBackground {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(nsColor: .controlBackgroundColor))
            }
        }
        .accessibilityElement(children: .combine)
    }
}

private struct ProviderKeyField: View {
    let provider: ChatProvider
    @Binding var text: String
    @State private var showingHelp = false
    @ObservedObject private var lang = LanguageStore.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Text(provider.displayName)
                    .font(.subheadline.weight(.medium))

                Button {
                    showingHelp.toggle()
                } label: {
                    Image(systemName: "info.circle")
                        .font(.body)
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .help(lang.t("settings.howToGetKey", provider.displayName))
                .accessibilityLabel(lang.t("settings.howToGetKey", provider.displayName))
                .popover(isPresented: $showingHelp, arrowEdge: .trailing) {
                    ProviderAPIKeyHelpView(provider: provider)
                }
            }

            TextEditor(text: $text)
                .font(.system(.body, design: .monospaced))
                .frame(minHeight: 44, maxHeight: 72)
                .overlay(alignment: .topLeading) {
                    if text.isEmpty {
                        Text(provider.placeholder(lang.language))
                            .font(.system(.caption, design: .monospaced))
                            .foregroundStyle(.tertiary)
                            .padding(.top, 8)
                            .padding(.leading, 5)
                            .allowsHitTesting(false)
                    }
                }
        }
    }
}

private struct ProviderAPIKeyHelpView: View {
    let provider: ChatProvider
    @ObservedObject private var lang = LanguageStore.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(lang.t("settings.getKeyTitle", provider.displayName))
                    .font(.headline)
                Text(provider.helpSummary(lang.language))
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(provider.helpSteps(lang.language).enumerated()), id: \.offset) { index, step in
                    HStack(alignment: .top, spacing: 8) {
                        Text("\(index + 1)")
                            .font(.caption.weight(.semibold).monospacedDigit())
                            .foregroundStyle(.secondary)
                            .frame(width: 16, alignment: .trailing)
                        Text(step)
                            .font(.callout)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }

            Button {
                NSWorkspace.shared.open(provider.helpURL)
            } label: {
                Label(lang.t("settings.openHost", provider.helpURL.host ?? provider.displayName), systemImage: "arrow.up.right")
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.small)

            Text(lang.t("settings.multipleKeys"))
                .font(.caption)
                .foregroundStyle(.secondary)

            APIKeyDisclaimer(showBackground: false)
        }
        .padding(16)
        .frame(width: 340, alignment: .leading)
    }
}

private final class HotkeyCaptureMonitor: ObservableObject {
    private var monitor: Any?

    func start(_ handler: @escaping (NSEvent) -> NSEvent?) {
        stop()
        monitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown, handler: handler)
    }

    func stop() {
        if let monitor {
            NSEvent.removeMonitor(monitor)
            self.monitor = nil
        }
    }

    deinit { stop() }
}

private struct HotkeyRecorderButton: View {
    let hotkey: PanelHotkey
    let onCapture: (PanelHotkey) -> Void

    @State private var isRecording = false
    @StateObject private var capture = HotkeyCaptureMonitor()
    @ObservedObject private var lang = LanguageStore.shared

    var body: some View {
        Button {
            if isRecording {
                stopRecording()
            } else {
                startRecording()
            }
        } label: {
            Text(isRecording ? lang.t("settings.typeShortcut") : hotkey.displayString)
                .font(.body.weight(.medium))
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(nsColor: .controlBackgroundColor))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(isRecording ? Color.accentColor : Color.secondary.opacity(0.35), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
        .help(isRecording ? lang.t("settings.pressShortcut") : lang.t("settings.changeShortcut"))
        .onDisappear { stopRecording() }
        .accessibilityLabel(lang.t("settings.shortcut"))
        .accessibilityValue(hotkey.displayString)
    }

    private func startRecording() {
        isRecording = true
        capture.start { event in
            handle(event)
            return nil
        }
    }

    private func stopRecording() {
        capture.stop()
        isRecording = false
    }

    private func handle(_ event: NSEvent) {
        if event.isARepeat { return }
        if event.keyCode == 53 {
            stopRecording()
            return
        }
        let shortcut = PanelHotkey.from(event: event)
        guard shortcut.hasRequiredModifier else {
            NSSound.beep()
            return
        }
        onCapture(shortcut)
        stopRecording()
    }
}
