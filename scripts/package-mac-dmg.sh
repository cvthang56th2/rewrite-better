#!/usr/bin/env bash
# Build a Release DMG and copy it to web/downloads/RewriteBetter.dmg
# Signing is still Apple Development unless you switch the Xcode target to Developer ID.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
proj="$root/mac/RewriteBetter"
dd="$proj/DerivedData"
stage="$root/mac/dist/dmg-stage"
dmg="$root/mac/dist/RewriteBetter-1.0.dmg"
web_dmg="$root/web/downloads/RewriteBetter.dmg"

mkdir -p "$root/mac/dist" "$root/web/downloads"
rm -rf "$stage"
mkdir -p "$stage"

xcodebuild \
  -project "$proj/RewriteBetter.xcodeproj" \
  -scheme RewriteBetter \
  -configuration Release \
  -destination 'generic/platform=macOS' \
  -derivedDataPath "$dd" \
  CODE_SIGN_IDENTITY="-" \
  CODE_SIGNING_REQUIRED=NO \
  DEVELOPMENT_TEAM="" \
  build

cp -R "$dd/Build/Products/Release/RewriteBetter.app" "$stage/"
ln -s /Applications "$stage/Applications"

rm -f "$dmg"
hdiutil create \
  -volname "Rewrite Better" \
  -srcfolder "$stage" \
  -ov \
  -format UDZO \
  "$dmg"

cp "$dmg" "$web_dmg"
echo "Wrote $dmg"
echo "Copied $web_dmg"
echo "A GitHub Release can use any .dmg filename; the site picks the latest .dmg asset automatically."
