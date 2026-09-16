import XCTest

final class OnboardingTests: XCTestCase {
    func testShowsWelcomeOnlyWhenNewAndWithoutKeys() {
        XCTAssertTrue(Onboarding.shouldShowWelcome(completed: false, hasApiKey: false))
        XCTAssertFalse(Onboarding.shouldShowWelcome(completed: true, hasApiKey: false))
        XCTAssertFalse(Onboarding.shouldShowWelcome(completed: false, hasApiKey: true))
        XCTAssertFalse(Onboarding.shouldShowWelcome(completed: true, hasApiKey: true))
    }

    func testCompletedFlagPersistsInDefaults() {
        let suite = "com.rewritebetter.onboarding-tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defaults.removePersistentDomain(forName: suite)

        let store = OnboardingStore(defaults: defaults)
        XCTAssertFalse(store.hasCompleted)
        store.complete()
        XCTAssertTrue(store.hasCompleted)

        let reloaded = OnboardingStore(defaults: defaults)
        XCTAssertTrue(reloaded.hasCompleted)

        defaults.removePersistentDomain(forName: suite)
    }
}
