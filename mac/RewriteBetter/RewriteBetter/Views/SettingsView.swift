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

                    Text("Global hotkey: ⌘⇧E — needs Accessibility to read selected text. Prefer the copy in /Applications.")
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
