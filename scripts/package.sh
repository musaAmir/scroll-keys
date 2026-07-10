#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

node -e "JSON.parse(require('node:fs').readFileSync('manifest.json', 'utf8'))"
for file in defaults.js background.js content.js options.js; do
  node --check "$file"
done
node tests/extension.test.js

VERSION=$(node -p "require('./manifest.json').version")
ARCHIVE="dist/keyboard-scroller-${VERSION}-webstore.zip"
STAGING=$(mktemp -d)
trap 'rm -rf "$STAGING"' EXIT INT TERM

mkdir -p "$STAGING/icons" dist
for file in manifest.json background.js defaults.js content.js options.html options.js LICENSE PRIVACY.md; do
  cp "$file" "$STAGING/$file"
done
for file in icons/icon16.png icons/icon48.png icons/icon128.png; do
  cp "$file" "$STAGING/$file"
done

rm -f "$ARCHIVE"
(cd "$STAGING" && zip -X -q -r "$ROOT/$ARCHIVE" .)

echo "Created $ARCHIVE"
