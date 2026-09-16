import SwiftUI

struct WelcomeView: View {
    @ObservedObject private var lang = LanguageStore.shared
    @ObservedObject private var hotkeys = HotkeyService.shared
    @State private var hasAccessibility = TextCaptureService.hasAccessibilityPermission
    var onAddKey: () -> Void
    var onPrivacy: () -> Void
    var onDone: () -> Void

    private var hasKey: Bool { SettingsStore.shared.hasAnyApiKey }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text(lang.t("onboarding.title"))
                    .font(.title2.weight(.semibold))
                Text(lang.t("onboarding.menubar"))
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            HStack {
                Text(lang.t("settings.language"))
                    .font(.subheadline.weight(.medium))
                Spacer()
                Picker(lang.t("settings.language"), selection: $lang.language) {
                    ForEach(AppLanguage.allCases) { language in
                        Text(language.displayName).tag(language)
                    }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .frame(maxWidth: 240)
            }

            VStack(alignment: .leading, spacing: 10) {
                step(done: hasAccessibility, text: lang.t("onboarding.step1"))
                step(done: hasKey, text: lang.t("onboarding.step2"))
                step(done: false, text: lang.t("onboarding.step3", hotkeys.current.displayString))
            }

            HStack(spacing: 8) {
                Button(lang.t("onboarding.enableAccessibility")) {
                    TextCaptureService.promptAccessibilityIfNeeded()
                    TextCaptureService.openAccessibilitySettings()
                    hasAccessibility = TextCaptureService.hasAccessibilityPermission
                }
                Button(lang.t("onboarding.addKey")) {
                    onAddKey()
                }
                .buttonStyle(.borderedProminent)
            }

            Button(lang.t("onboarding.privacy")) {
                onPrivacy()
            }
            .buttonStyle(.link)

            Spacer(minLength: 0)

            HStack {
                Spacer()
                Button(lang.t("onboarding.done")) {
                    OnboardingStore.shared.complete()
                    onDone()
                }
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(24)
        .frame(minWidth: 480, idealWidth: 520, minHeight: 420)
        .onAppear {
            TextCaptureService.promptAccessibilityIfNeeded()
            hasAccessibility = TextCaptureService.hasAccessibilityPermission
        }
        .onReceive(NotificationCenter.default.publisher(for: NSApplication.didBecomeActiveNotification)) { _ in
            hasAccessibility = TextCaptureService.hasAccessibilityPermission
        }
    }

    private func step(done: Bool, text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(done ? Color.accentColor : .secondary)
                .font(.body)
                .accessibilityLabel(done ? lang.t("settings.testOk") : "")
            Text(text)
                .font(.callout)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }
}
