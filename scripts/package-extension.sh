#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
out_dir="$root/web/downloads"
zip_path="$out_dir/rewrite-better-chrome.zip"

mkdir -p "$out_dir"
rm -f "$zip_path"

(
  cd "$root/chrome"
  zip -r "$zip_path" . \
    -x "*.DS_Store" \
    -x "*README.md" \
    -x "*/*.test.js" \
    -x "*.test.js"
)

echo "Wrote $zip_path"
