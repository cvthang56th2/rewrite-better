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
            LazyVGrid(columns: columns, alignment: .leading, spacing: 6) {
                ForEach(options) { item in
                    Button {
                        selection = item.value
                    } label: {
                        Text(item.label)
                            .font(.caption)
                            .lineLimit(2)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: .infinity, minHeight: Theme.chipMinHeight)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 6)
                            .background(selection == item.value ? Color.accentColor.opacity(0.16) : Theme.fill)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(selection == item.value ? Color.accentColor : Theme.line, lineWidth: 1)
                            )
                            .cornerRadius(8)
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(selection == item.value ? .isSelected : [])
                }
            }
        }
    }
}
