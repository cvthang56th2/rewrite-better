import Foundation

enum Onboarding {
    static func shouldShowWelcome(completed: Bool, hasApiKey: Bool) -> Bool {
        !completed && !hasApiKey
    }
}

final class OnboardingStore {
    static let shared = OnboardingStore()
    static let completedKey = "hasCompletedOnboarding"

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var hasCompleted: Bool {
        get { defaults.bool(forKey: Self.completedKey) }
        set { defaults.set(newValue, forKey: Self.completedKey) }
    }

    func shouldShowWelcome(hasApiKey: Bool) -> Bool {
        Onboarding.shouldShowWelcome(completed: hasCompleted, hasApiKey: hasApiKey)
    }

    func complete() {
        hasCompleted = true
    }
}
