#!/usr/bin/env bash
# Build a shareable DMG. Optional Developer ID + notarization:
#   CODESIGN_IDENTITY="Developer ID Application: Name (TEAMID)"
#   APPLE_ID="you@example.com"
#   APPLE_TEAM_ID="TEAMID"
#   APPLE_APP_PASSWORD="app-specific-password"
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$ROOT/RewriteBetter/RewriteBetter.xcodeproj"
DERIVED="$ROOT/RewriteBetter/DerivedData"
APP_NAME="RewriteBetter"
if [[ -z "${VERSION:-}" && -f "$ROOT/../scripts/release-version.js" ]]; then
  VERSION="$(node "$ROOT/../scripts/release-version.js")"
fi
VERSION="${VERSION#v}"
VERSION="${VERSION:-1.0.0}"
DIST="$ROOT/dist"
STAGE="$DIST/dmg-stage"
DMG="$DIST/RewriteBetter-${VERSION}.dmg"
ICON_SRC="$ROOT/RewriteBetter/RewriteBetter/Resources/icon.png"
ICONSET="$ROOT/RewriteBetter/RewriteBetter/Assets.xcassets/AppIcon.appiconset"

generate_icons() {
  if [[ ! -f "$ICON_SRC" ]]; then
    echo "Missing icon source: $ICON_SRC" >&2
    exit 1
  fi
  mkdir -p "$ICONSET"
  sips -z 16 16 "$ICON_SRC" --out "$ICONSET/icon_16x16.png" >/dev/null
  sips -z 32 32 "$ICON_SRC" --out "$ICONSET/icon_16x16@2x.png" >/dev/null
  sips -z 32 32 "$ICON_SRC" --out "$ICONSET/icon_32x32.png" >/dev/null
  sips -z 64 64 "$ICON_SRC" --out "$ICONSET/icon_32x32@2x.png" >/dev/null
  sips -z 128 128 "$ICON_SRC" --out "$ICONSET/icon_128x128.png" >/dev/null
  sips -z 256 256 "$ICON_SRC" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
  sips -z 256 256 "$ICON_SRC" --out "$ICONSET/icon_256x256.png" >/dev/null
  sips -z 512 512 "$ICON_SRC" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
  sips -z 512 512 "$ICON_SRC" --out "$ICONSET/icon_512x512.png" >/dev/null
  sips -z 1024 1024 "$ICON_SRC" --out "$ICONSET/icon_512x512@2x.png" >/dev/null
}

if [[ "${1:-}" == "--icons-only" ]]; then
  generate_icons
  echo "Wrote app icons in $ICONSET"
  exit 0
fi

generate_icons

echo "Building Release…"
xcodebuild \
  -project "$PROJECT" \
  -scheme RewriteBetter \
  -configuration Release \
  -destination 'generic/platform=macOS' \
  -derivedDataPath "$DERIVED" \
  MARKETING_VERSION="$VERSION" \
  CURRENT_PROJECT_VERSION="$VERSION" \
  CODE_SIGN_IDENTITY="-" \
  CODE_SIGNING_REQUIRED=NO \
  DEVELOPMENT_TEAM="" \
  build

APP="$DERIVED/Build/Products/Release/${APP_NAME}.app"
if [[ ! -d "$APP" ]]; then
  echo "Build did not produce $APP" >&2
  exit 1
fi

if [[ -n "${CODESIGN_IDENTITY:-}" ]]; then
  echo "Signing with $CODESIGN_IDENTITY…"
  codesign --force --deep --options runtime --timestamp \
    --sign "$CODESIGN_IDENTITY" "$APP"
  codesign --verify --deep --strict "$APP"
fi

rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -R "$APP" "$STAGE/"
ln -s /Applications "$STAGE/Applications"

rm -f "$DMG"
hdiutil create \
  -volname "Rewrite Better" \
  -srcfolder "$STAGE" \
  -ov \
  -format UDZO \
  "$DMG"

if [[ -n "${CODESIGN_IDENTITY:-}" ]]; then
  codesign --force --timestamp --sign "$CODESIGN_IDENTITY" "$DMG" || true
fi

if [[ -n "${APPLE_ID:-}" && -n "${APPLE_TEAM_ID:-}" && -n "${APPLE_APP_PASSWORD:-}" ]]; then
  echo "Submitting for notarization…"
  xcrun notarytool submit "$DMG" \
    --apple-id "$APPLE_ID" \
    --team-id "$APPLE_TEAM_ID" \
    --password "$APPLE_APP_PASSWORD" \
    --wait
  xcrun stapler staple "$DMG"
  echo "Notarized: $DMG"
else
  echo "Skipping notarization (set APPLE_ID, APPLE_TEAM_ID, APPLE_APP_PASSWORD to enable)."
  echo "Friends may need to right-click → Open the first time if the build is unsigned."
fi

echo "DMG: $DMG"
