import SwiftUI

struct PrivacyView: View {
    @ObservedObject private var lang = LanguageStore.shared

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(lang.t("privacy.title"))
                    .font(.title2.weight(.semibold))
                Text(lang.t("privacy.intro"))
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)

                claim(icon: "lock.shield.fill", title: lang.t("privacy.keysTitle"), body: lang.t("privacy.keysBody"))
                claim(icon: "arrow.up.forward.app", title: lang.t("privacy.transitTitle"), body: lang.t("privacy.transitBody"))
                claim(icon: "hand.raised.fill", title: lang.t("privacy.a11yTitle"), body: lang.t("privacy.a11yBody"))
                claim(icon: "eye.slash.fill", title: lang.t("privacy.analyticsTitle"), body: lang.t("privacy.analyticsBody"))

                Text(lang.t("privacy.responsibility"))
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .textSelection(.enabled)
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(minWidth: 480, idealWidth: 560, minHeight: 360)
    }

    private func claim(icon: String, title: String, body: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(Color.accentColor)
                .frame(width: 28)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(body)
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .textSelection(.enabled)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.fill)
        .cornerRadius(Theme.radius)
        .accessibilityElement(children: .combine)
    }
}
