import XCTest

final class L10nTests: XCTestCase {
    func testParseUnknownLanguageDefaultsToEnglish() {
        XCTAssertEqual(AppLanguage.parse(nil), .en)
        XCTAssertEqual(AppLanguage.parse(""), .en)
        XCTAssertEqual(AppLanguage.parse("fr"), .en)
        XCTAssertEqual(AppLanguage.parse("en"), .en)
        XCTAssertEqual(AppLanguage.parse("vi"), .vi)
    }

    func testLooksUpEnglishString() {
        XCTAssertEqual(L10n.t("settings.save", language: .en), "Save")
    }

    func testLooksUpVietnameseString() {
        XCTAssertEqual(L10n.t("settings.save", language: .vi), "Lưu")
    }

    func testMissingVietnameseKeyFallsBackToEnglish() {
        XCTAssertEqual(L10n.t("settings.save", language: .vi), "Lưu")
        let english = L10n.t("__missing_key_for_test__", language: .en)
        XCTAssertEqual(english, "__missing_key_for_test__")
        XCTAssertEqual(L10n.t("__missing_key_for_test__", language: .vi), "__missing_key_for_test__")
    }

    func testInterpolatesPlaceholders() {
        XCTAssertEqual(
            L10n.t("error.http", language: .en, "418", "teapot"),
            "AI API error: HTTP 418 - teapot"
        )
    }

    func testEnglishAndVietnameseCatalogsHaveTheSameKeys() {
        XCTAssertEqual(L10n.keys(for: .en), L10n.keys(for: .vi))
        XCTAssertFalse(L10n.keys(for: .en).isEmpty)
        for key in ["onboarding.title", "privacy.title", "menu.privacy", "menu.welcome", "menu.checkForUpdates"] {
            XCTAssertTrue(L10n.keys(for: .en).contains(key), "missing \(key)")
        }
    }

    func testLanguageStoreDefaultsToEnglishAndPersists() {
        let suite = "com.rewritebetter.l10n-tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defaults.removePersistentDomain(forName: suite)

        let store = LanguageStore(defaults: defaults)
        XCTAssertEqual(store.language, .en)
        XCTAssertEqual(store.t("settings.save"), "Save")

        store.language = .vi
        XCTAssertEqual(store.t("settings.save"), "Lưu")

        let reloaded = LanguageStore(defaults: defaults)
        XCTAssertEqual(reloaded.language, .vi)
        XCTAssertEqual(reloaded.t("settings.save"), "Lưu")

        defaults.removePersistentDomain(forName: suite)
    }
}
