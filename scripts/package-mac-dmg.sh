#!/usr/bin/env bash
# Build a Release DMG and copy it to web/downloads/RewriteBetter.dmg
# Signing is still Apple Development unless you switch the Xcode target to Developer ID.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
web_dmg="$root/web/downloads/RewriteBetter.dmg"
VERSION="${VERSION:-$(node "$root/scripts/release-version.js")}"
VERSION="${VERSION#v}"
export VERSION

"$root/mac/package.sh"

mkdir -p "$root/web/downloads"
cp "$root/mac/dist/RewriteBetter-${VERSION}.dmg" "$web_dmg"
echo "Wrote $root/mac/dist/RewriteBetter-${VERSION}.dmg"
echo "Copied $web_dmg"
echo "A GitHub Release can use any .dmg filename; the site picks the latest .dmg asset automatically."
