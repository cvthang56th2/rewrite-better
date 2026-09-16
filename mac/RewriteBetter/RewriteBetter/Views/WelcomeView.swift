import SwiftUI

struct WelcomeView: View {
    @ObservedObject private var lang = LanguageStore.shared
    @ObservedObject private var hotkeys = HotkeyService.shared
    var onAddKey: () -> Void
    var onPrivacy: () -> Void
    var onDone: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(lang.t("onboarding.title"))
                .font(.title2.weight(.semibold))

            Text(lang.t("onboarding.menubar"))
                .font(.callout)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

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

            VStack(alignment: .leading, spacing: 12) {
                step(number: 1, text: lang.t("onboarding.step1"))
                step(number: 2, text: lang.t("onboarding.step2"))
                step(number: 3, text: lang.t("onboarding.step3", hotkeys.current.displayString))
            }

            HStack(spacing: 8) {
                Button(lang.t("onboarding.enableAccessibility")) {
                    TextCaptureService.promptAccessibilityIfNeeded()
                    TextCaptureService.openAccessibilitySettings()
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
        }
    }

    private func step(number: Int, text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text("\(number)")
                .font(.caption.weight(.semibold).monospacedDigit())
                .foregroundStyle(.secondary)
                .frame(width: 18, alignment: .trailing)
            Text(text)
                .font(.callout)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
