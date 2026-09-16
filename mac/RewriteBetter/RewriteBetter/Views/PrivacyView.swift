import SwiftUI

struct PrivacyView: View {
    @ObservedObject private var lang = LanguageStore.shared

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text(lang.t("privacy.title"))
                    .font(.title2.weight(.semibold))
                Text(lang.t("privacy.body"))
                    .font(.body)
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)
                    .textSelection(.enabled)
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(minWidth: 480, idealWidth: 560, minHeight: 360)
    }
}
