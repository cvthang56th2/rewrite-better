import Foundation
import Security

final class SettingsStore {
    static let shared = SettingsStore()

    private let service = "com.rewritebetter.macos"
    private let legacyGroqAccount = "groqApiKey"

    private init() {
        migrateLegacyGroqKeyIfNeeded()
    }

    var hasAnyApiKey: Bool {
        !resolveBackends().isEmpty
    }

    func keys(for provider: ChatProvider) -> String {
        readKeychain(account: account(for: provider)) ?? ""
    }

    func setKeys(_ value: String, for provider: ChatProvider) {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            deleteKeychain(account: account(for: provider))
        } else {
            saveKeychain(trimmed, account: account(for: provider))
        }
        LLMClient.shared.resetDailySkips()
    }

    func keysByProvider() -> [ChatProvider: String] {
        Dictionary(uniqueKeysWithValues: ChatProvider.allCases.map { ($0, keys(for: $0)) })
    }

    func isProviderEnabled(_ provider: ChatProvider) -> Bool {
        let defaults = UserDefaults.standard
        let key = enabledKey(for: provider)
        guard defaults.object(forKey: key) != nil else { return true }
        return defaults.bool(forKey: key)
    }

    func setProviderEnabled(_ enabled: Bool, for provider: ChatProvider) {
        UserDefaults.standard.set(enabled, forKey: enabledKey(for: provider))
    }

    func enabledByProvider() -> [ChatProvider: Bool] {
        Dictionary(uniqueKeysWithValues: ChatProvider.allCases.map { ($0, isProviderEnabled($0)) })
    }

    func resolveBackends() -> [ChatBackend] {
        LLMProviders.resolveChatBackends(
            keysByProvider: keysByProvider(),
            enabledProviders: enabledByProvider()
        )
    }

    private func enabledKey(for provider: ChatProvider) -> String {
        "providerEnabled.\(provider.rawValue)"
    }

    // MARK: - Legacy

    /// Old single-key API used by earlier builds — maps to Groq raw string.
    var apiKey: String? {
        get {
            let groq = keys(for: .groq)
            return groq.isEmpty ? nil : groq
        }
        set {
            setKeys(newValue ?? "", for: .groq)
        }
    }

    var hasApiKey: Bool { hasAnyApiKey }

    // MARK: - Panel hotkey

    private let hotkeyKeyCodeKey = "panelHotkeyKeyCode"
    private let hotkeyModifiersKey = "panelHotkeyModifiers"

    var panelHotkey: PanelHotkey {
        get {
            let defaults = UserDefaults.standard
            guard defaults.object(forKey: hotkeyKeyCodeKey) != nil else {
                return .default
            }
            return PanelHotkey(
                keyCode: UInt32(defaults.integer(forKey: hotkeyKeyCodeKey)),
                carbonModifiers: UInt32(defaults.integer(forKey: hotkeyModifiersKey))
            )
        }
        set {
            let defaults = UserDefaults.standard
            defaults.set(Int(newValue.keyCode), forKey: hotkeyKeyCodeKey)
            defaults.set(Int(newValue.carbonModifiers), forKey: hotkeyModifiersKey)
        }
    }

    // MARK: - Extra instructions (per mode)

    func extraInstructions(for mode: AppMode) -> String {
        UserDefaults.standard.string(forKey: extraInstructionsKey(for: mode)) ?? ""
    }

    func setExtraInstructions(_ value: String, for mode: AppMode) {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        let key = extraInstructionsKey(for: mode)
        if trimmed.isEmpty {
            UserDefaults.standard.removeObject(forKey: key)
        } else {
            UserDefaults.standard.set(trimmed, forKey: key)
        }
    }

    private func extraInstructionsKey(for mode: AppMode) -> String {
        "extraInstructions.\(mode.rawValue)"
    }

    // MARK: - Voice profile

    var voiceSamples: String {
        get { UserDefaults.standard.string(forKey: "voiceSamples") ?? "" }
        set {
            let trimmed = newValue.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty {
                UserDefaults.standard.removeObject(forKey: "voiceSamples")
            } else {
                UserDefaults.standard.set(trimmed, forKey: "voiceSamples")
            }
        }
    }

    // MARK: - Keychain

    private func account(for provider: ChatProvider) -> String {
        "\(provider.rawValue)ApiKeys"
    }

    private func migrateLegacyGroqKeyIfNeeded() {
        let current = readKeychain(account: account(for: .groq))
        if let current, !current.isEmpty { return }
        guard let legacy = readKeychain(account: legacyGroqAccount), !legacy.isEmpty else { return }
        saveKeychain(legacy, account: account(for: .groq))
        deleteKeychain(account: legacyGroqAccount)
    }

    private func readKeychain(account: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess, let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func saveKeychain(_ value: String, account: String) {
        deleteKeychain(account: account)
        let data = Data(value.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlocked
        ]
        SecItemAdd(query as CFDictionary, nil)
    }

    private func deleteKeychain(account: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
    }
}
