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

                    providerField("Gemini", text: $geminiKeys, placeholder: ChatProvider.gemini.placeholder)
                    providerField("Groq", text: $groqKeys, placeholder: ChatProvider.groq.placeholder)
                    providerField("Cerebras", text: $cerebrasKeys, placeholder: ChatProvider.cerebras.placeholder)
                    providerField("OpenAI", text: $openaiKeys, placeholder: ChatProvider.openai.placeholder)

                    Text("Keys are stored only in your Mac Keychain.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
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

    @ViewBuilder
    private func providerField(_ title: String, text: Binding<String>, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.subheadline.weight(.medium))
            TextEditor(text: text)
                .font(.system(.body, design: .monospaced))
                .frame(minHeight: 44, maxHeight: 72)
                .overlay(alignment: .topLeading) {
                    if text.wrappedValue.isEmpty {
                        Text(placeholder)
                            .font(.system(.caption, design: .monospaced))
                            .foregroundStyle(.tertiary)
                            .padding(.top, 8)
                            .padding(.leading, 5)
                            .allowsHitTesting(false)
                    }
                }
        }
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
