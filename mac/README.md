# Rewrite Better for macOS

Native SwiftUI menu bar app with Rewrite / Format / Reply, multi-provider failover (Gemini → Groq → Cerebras → OpenAI), and paste-back into the app you came from.

## Requirements

- macOS 13+
- Xcode 15+
- At least one API key: [Gemini](https://aistudio.google.com/apikey), [Groq](https://console.groq.com/keys), [Cerebras](https://cloud.cerebras.ai), or [OpenAI](https://platform.openai.com/api-keys)

## First run

1. Launch the app — it appears in the menu bar (no Dock icon)
2. Pick **English** or **Tiếng Việt** on the welcome screen
3. Enable **Accessibility** when macOS asks (needed to read selected text)
4. Add an API key in Settings. Keys stay in Keychain on this Mac
5. Select text anywhere → press **⌘⇧E** (customizable) → rewrite → **Replace** (⌥⌘↩) to put the result back

Welcome is skipped if you already have a key. Reopen it from the menu bar or Settings.

Privacy details: [PRIVACY.md](../PRIVACY.md) (also **Privacy…** in the menu bar).

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

Kill, rebuild, and relaunch in one step:

```bash
./mac/restart.sh
```

## Share with friends

```bash
./mac/package.sh
```

Output: `mac/dist/RewriteBetter-1.0.dmg`

The script generates the app icon from `Resources/icon.png`, builds Release, and makes a DMG.

To sign and notarize (Developer ID):

```bash
export CODESIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_ID="you@example.com"
export APPLE_TEAM_ID="TEAMID"
export APPLE_APP_PASSWORD="app-specific-password"
./mac/package.sh
```

Without notarization, friends may need to right-click → **Open** the first time.

## Quota / failover

Keys are tried in order: Gemini → Groq → Cerebras → OpenAI. Quota, rate-limit, or invalid-key failures rest that key until tomorrow and continue with the next. Network errors retry the next key **without** resting the failed one.
