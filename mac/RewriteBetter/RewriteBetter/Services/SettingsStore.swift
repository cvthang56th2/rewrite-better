import Foundation
import Security

final class SettingsStore {
    static let shared = SettingsStore()

    private let service = "com.rewritebetter.macos"
    private let account = "groqApiKey"

    private init() {}

    var apiKey: String? {
        get { readKeychain() }
        set {
            if let newValue, !newValue.isEmpty {
                saveKeychain(newValue)
            } else {
                deleteKeychain()
            }
        }
    }

    var hasApiKey: Bool {
        guard let key = apiKey else { return false }
        return key.hasPrefix("gsk_")
    }

    private func readKeychain() -> String? {
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

    private func saveKeychain(_ value: String) {
        deleteKeychain()
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

    private func deleteKeychain() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
    }
}
