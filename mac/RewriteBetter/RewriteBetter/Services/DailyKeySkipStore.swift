import Foundation

/// Persists failed backend skip ids until the next local calendar day.
enum DailyKeySkipStore {
    private static let defaultsKey = "llmDailySkippedKeys"
    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar.current
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static var today: String {
        dayFormatter.string(from: Date())
    }

    /// Skip ids that are still resting today.
    static func activeSkipIds() -> Set<String> {
        let today = Self.today
        let stored = load()
        let active = stored.compactMap { id, day -> String? in
            day == today ? id : nil
        }
        // Drop expired entries so the map stays small.
        if stored.contains(where: { $0.value != today }) {
            save(Dictionary(uniqueKeysWithValues: active.map { ($0, today) }))
        }
        return Set(active)
    }

    static func markSkipped(_ skipIds: Set<String>) {
        guard !skipIds.isEmpty else { return }
        let today = Self.today
        var stored = load()
        for id in skipIds {
            stored[id] = today
        }
        // Prune other days while writing.
        stored = stored.filter { $0.value == today }
        save(stored)
    }

    static func clearAll() {
        UserDefaults.standard.removeObject(forKey: defaultsKey)
    }

    private static func load() -> [String: String] {
        (UserDefaults.standard.dictionary(forKey: defaultsKey) as? [String: String]) ?? [:]
    }

    private static func save(_ value: [String: String]) {
        UserDefaults.standard.set(value, forKey: defaultsKey)
    }
}
