# Rewrite Better for macOS

Native SwiftUI menu bar app with the same Rewrite / Format / Reply features as the Chrome extension.

## Requirements

- macOS 13+
- Xcode 15+
- Groq API key ([console.groq.com](https://console.groq.com))

## Build & run

```bash
cd mac/RewriteBetter
open RewriteBetter.xcodeproj
```

Or from the command line:

```bash
cd mac/RewriteBetter
xcodebuild -scheme RewriteBetter -configuration Debug -derivedDataPath ./DerivedData build
open DerivedData/Build/Products/Debug/RewriteBetter.app
```

## Usage

1. Launch the app — it appears in the menu bar (no Dock icon)
2. Open **Settings** and paste your Groq API key
3. Grant **Accessibility** when prompted (needed to read selected text)
4. Select text anywhere → press **⌘⇧E** (or click the menu bar icon → Open Panel)
5. Choose mode/options → run → result is copied to the clipboard

## Share with friends

Build Release and create a DMG:

```bash
cd mac/RewriteBetter
xcodebuild -scheme RewriteBetter -configuration Release -derivedDataPath ./DerivedData build

# Then package (or reuse the script below):
mkdir -p ../dist/dmg-stage
cp -R DerivedData/Build/Products/Release/RewriteBetter.app ../dist/dmg-stage/
ln -s /Applications ../dist/dmg-stage/Applications
hdiutil create -volname "Rewrite Better" -srcfolder ../dist/dmg-stage -ov -format UDZO ../dist/RewriteBetter-1.0.dmg
```

Output: `mac/dist/RewriteBetter-1.0.dmg`

Friends may need to right-click → **Open** the first time (ad-hoc / unsigned build).
