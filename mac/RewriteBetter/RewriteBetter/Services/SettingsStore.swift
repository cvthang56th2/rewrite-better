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

    func resolveBackends() -> [ChatBackend] {
        LLMProviders.resolveChatBackends(keysByProvider: keysByProvider())
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
