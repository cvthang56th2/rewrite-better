import AppKit
import SwiftUI

struct SettingsView: View {
    @State private var apiKey: String = SettingsStore.shared.apiKey ?? ""
    @State private var message = ""
    @State private var isTesting = false

    var body: some View {
        Form {
            Section {
                SecureField("Groq API Key (gsk_…)", text: $apiKey)
                    .textFieldStyle(.roundedBorder)

                Text("Get a free key at console.groq.com. The key is stored only in your Mac Keychain.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Section {
                HStack {
                    Button("Save") {
                        SettingsStore.shared.apiKey = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
                        message = "✅ Saved"
                    }
                    .keyboardShortcut(.defaultAction)

                    Button("Test key") {
                        Task { await testKey() }
                    }
                    .disabled(isTesting || apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                    Spacer()

                    Button("Open Accessibility…") {
                        TextCaptureService.requestAccessibilityPermission()
                        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility") {
                            NSWorkspace.shared.open(url)
                        }
                    }
                }

                if !message.isEmpty {
                    Text(message)
                        .font(.callout)
                }

                Text("Global hotkey: ⌘⇧E — needs Accessibility permission to read selected text.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(20)
        .frame(width: 420, height: 260)
    }

    private func testKey() async {
        isTesting = true
        defer { isTesting = false }
        let key = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        SettingsStore.shared.apiKey = key
        let ok = await GroqClient().testApiKey(key)
        message = ok ? "✅ Key works" : "❌ Key failed — check and try again"
    }
}
