import SwiftUI

struct ChipGroup: View {
    let title: String
    let options: [OptionItem]
    @Binding var selection: String

    private let columns = [GridItem(.adaptive(minimum: 64), spacing: 5)]

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            if !title.isEmpty {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            LazyVGrid(columns: columns, alignment: .leading, spacing: 5) {
                ForEach(options) { item in
                    Button {
                        selection = item.value
                    } label: {
                        Text(item.label)
                            .font(.caption2)
                            .lineLimit(1)
                            .minimumScaleFactor(0.85)
                            .frame(maxWidth: .infinity)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 5)
                            .background(selection == item.value ? Color.accentColor.opacity(0.18) : Color(nsColor: .controlBackgroundColor))
                            .overlay(
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(selection == item.value ? Color.accentColor : Color.secondary.opacity(0.25), lineWidth: 1)
                            )
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}
