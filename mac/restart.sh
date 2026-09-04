#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/RewriteBetter" && pwd)"
cd "$ROOT"

killall RewriteBetter 2>/dev/null || true

xcodebuild -scheme RewriteBetter -configuration Debug -derivedDataPath ./DerivedData build
open DerivedData/Build/Products/Debug/RewriteBetter.app
