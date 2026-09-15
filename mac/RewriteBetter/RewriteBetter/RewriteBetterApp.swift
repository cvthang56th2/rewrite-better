import SwiftUI
import AppKit

@main
struct RewriteBetterApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @ObservedObject private var hotkeys = HotkeyService.shared

    var body: some Scene {
        MenuBarExtra("Rewrite Better", systemImage: "text.bubble") {
            Button("Open Panel") {
                PanelController.shared.openFromMenu()
            }
            .panelHotkeyShortcut(hotkeys.current)

            Button("Open Empty Panel") {
                PanelController.shared.openEmpty()
            }

            Divider()

            Button("Settings…") {
                PanelController.shared.openSettings()
            }

            Divider()

            Button("Quit Rewrite Better") {
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
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }
}
