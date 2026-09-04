import AppKit
import SwiftUI

struct SettingsView: View {
    @State private var apiKey: String = SettingsStore.shared.apiKey ?? ""
    @State private var message = ""
    @State private var isTesting = false
    @State private var launchAtLogin = LaunchAtLogin.isEnabled
    @State private var launchAtLoginError = ""

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
                        TextCaptureService.openAccessibilitySettings()
                    }
                }

                if !message.isEmpty {
                    Text(message)
                        .font(.callout)
                }

                Text("Global hotkey: ⌘⇧E — needs Accessibility to read selected text. Prefer the copy in /Applications.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(20)
        .frame(width: 440, height: 340)
        .onAppear {
            launchAtLogin = LaunchAtLogin.isEnabled
        }
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
