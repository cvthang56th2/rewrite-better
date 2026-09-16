import SwiftUI
import AppKit

@main
struct RewriteBetterApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @ObservedObject private var hotkeys = HotkeyService.shared
    @ObservedObject private var lang = LanguageStore.shared

    var body: some Scene {
        MenuBarExtra("Rewrite Better", systemImage: "text.bubble") {
            Button(lang.t("menu.openPanel")) {
                PanelController.shared.openFromMenu()
            }
            .panelHotkeyShortcut(hotkeys.current)

            Button(lang.t("menu.openEmptyPanel")) {
                PanelController.shared.openEmpty()
            }

            Divider()

            Button(lang.t("menu.welcome")) {
                PanelController.shared.openWelcome()
            }

            Button(lang.t("menu.settings")) {
                PanelController.shared.openSettings()
            }

            Button(lang.t("menu.privacy")) {
                PanelController.shared.openPrivacy()
            }

            Divider()

            Button(lang.t("menu.quit")) {
                NSApplication.shared.terminate(nil)
            }
            .keyboardShortcut("q", modifiers: [.command])
        }
    }
}

private extension View {
    @ViewBuilder
    func panelHotkeyShortcut(_ hotkey: PanelHotkey) -> some View {
        if let keyEquivalent = hotkey.keyEquivalent {
            self.keyboardShortcut(keyEquivalent, modifiers: hotkey.swiftUIModifiers)
        } else {
            self
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Accessory app: no Dock icon.
        NSApp.setActivationPolicy(.accessory)
        FrontmostAppTracker.shared.start()
        PanelController.shared.setup()
        TextCaptureService.promptAccessibilityIfNeeded()
        if OnboardingStore.shared.shouldShowWelcome(hasApiKey: SettingsStore.shared.hasAnyApiKey) {
            PanelController.shared.openWelcome()
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }
}
