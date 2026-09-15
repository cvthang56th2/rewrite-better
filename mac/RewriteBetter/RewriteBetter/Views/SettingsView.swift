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
    @State private var rewriteExtra = ""
    @State private var formatExtra = ""
    @State private var replyExtra = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Failover order: Gemini → Groq → Cerebras → OpenAI. Multiple keys per provider: separate with comma or newline. On quota/rate-limit, the next key is used until all are exhausted.")
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
                    Toggle("Open at login", isOn: $launchAtLogin)
                        .onChange(of: launchAtLogin) { newValue in
                            do {
                                _ = try LaunchAtLogin.setEnabled(newValue)
                                launchAtLogin = LaunchAtLogin.isEnabled
                                launchAtLoginError = ""
                                message = newValue ? "✅ Will open when you log in" : "✅ Won’t open at login"
                            } catch {
                                launchAtLogin = LaunchAtLogin.isEnabled
                                launchAtLoginError = error.localizedDescription
                                message = "❌ Không bật được Open at login"
                            }
                        }

                    Text("Starts Rewrite Better in the menu bar when you log in to this Mac.")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if !launchAtLoginError.isEmpty {
                        Text(launchAtLoginError)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }

                    HStack(spacing: 8) {
                        Text("Open panel shortcut")
                            .font(.subheadline.weight(.medium))
                        Spacer()
                        if hotkeys.current != .default {
                            Button("Reset") {
                                applyHotkey(.default)
                            }
                            .controlSize(.small)
                        }
                        HotkeyRecorderButton(hotkey: hotkeys.current) { shortcut in
                            applyHotkey(shortcut)
                        }
                    }

                    Text("Click the shortcut, then press a new combo. Include ⌘, ⌥, or ⌃. Esc cancels.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Divider()

                VStack(alignment: .leading, spacing: 10) {
                    Text("Extra instructions")
                        .font(.headline)

                    Text("Optional. Added on top of the built-in prompt for that mode. The app still requires only the final text back — these cannot replace that rule.")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    ExtraInstructionsEditor(
                        title: "Rewrite",
                        text: $rewriteExtra,
                        placeholder: "e.g. Always write in Vietnamese. Keep my voice. No emoji."
                    )
                    ExtraInstructionsEditor(
                        title: "Format",
                        text: $formatExtra,
                        placeholder: "e.g. Prefer ATX headings. Never wrap in a code fence."
                    )
                    ExtraInstructionsEditor(
                        title: "Reply",
                        text: $replyExtra,
                        placeholder: "e.g. Sign off as Thắng. Be warm but brief."
                    )
                }

                Divider()

                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Button("Save") {
                            saveKeys()
                            message = "✅ Saved"
                        }
                        .keyboardShortcut(.defaultAction)

                        Button("Test keys") {
                            Task { await testKeys() }
                        }
                        .disabled(isTesting || !hasAnyDraftKey)

                        Spacer()

                        Button("Open Accessibility…") {
                            TextCaptureService.openAccessibilitySettings()
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

                    Text("\(hotkeys.current.displayString) needs Accessibility to read selected text. Prefer the copy in /Applications.")
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
    }

    private func applyHotkey(_ shortcut: PanelHotkey) {
        if HotkeyService.shared.apply(shortcut) {
            message = "✅ Shortcut set to \(shortcut.displayString)"
        } else {
            message = "Couldn't register \(shortcut.displayString). That combo may already be in use."
        }
    }

    private func testKeys() async {
        isTesting = true
        defer { isTesting = false }
        saveKeys()
        keyTestResults = []
        message = "⏳ Testing each key…"

        let results = await LLMClient.shared.testAllKeys()
        keyTestResults = results

        guard !results.isEmpty else {
            message = LLMError.missingKey.localizedDescription
            return
        }

        let okCount = results.filter(\.ok).count
        let failCount = results.count - okCount
        if failCount == 0 {
            message = "✅ All \(okCount) key(s) work"
        } else if okCount == 0 {
            message = "❌ All \(failCount) key(s) failed"
        } else {
            message = "⚠️ \(okCount) OK · \(failCount) failed"
        }
    }
}

private struct ExtraInstructionsEditor: View {
    let title: String
    @Binding var text: String
    let placeholder: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.subheadline.weight(.medium))

            TextEditor(text: $text)
                .font(.system(.body))
                .frame(minHeight: 56, maxHeight: 88)
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

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "lock.shield")
                .foregroundStyle(.secondary)
                .padding(.top, 1)

            Text("API keys are stored only on this Mac (Keychain). They are never uploaded or saved anywhere else. You are responsible for keeping them private. The developer is not liable if a key is leaked.")
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
                .help("How to get a \(provider.displayName) API key")
                .accessibilityLabel("How to get a \(provider.displayName) API key")
                .popover(isPresented: $showingHelp, arrowEdge: .trailing) {
                    ProviderAPIKeyHelpView(provider: provider)
                }
            }

            TextEditor(text: $text)
                .font(.system(.body, design: .monospaced))
                .frame(minHeight: 44, maxHeight: 72)
                .overlay(alignment: .topLeading) {
                    if text.isEmpty {
                        Text(provider.placeholder)
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

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Get a \(provider.displayName) API key")
                    .font(.headline)
                Text(provider.helpSummary)
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(provider.helpSteps.enumerated()), id: \.offset) { index, step in
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
                Label("Open \(provider.helpURL.host ?? provider.displayName)", systemImage: "arrow.up.right")
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.small)

            Text("You can add more than one key, separated by comma or newline.")
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

    var body: some View {
        Button {
            if isRecording {
                stopRecording()
            } else {
                startRecording()
            }
        } label: {
            Text(isRecording ? "Type shortcut…" : hotkey.displayString)
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
        .help(isRecording ? "Press a shortcut, or Esc to cancel" : "Click to change the shortcut")
        .onDisappear { stopRecording() }
        .accessibilityLabel("Open panel shortcut")
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
