#!/usr/bin/env bash
# Rebuild the downloadable PDF catalog: bash build/catalog.sh   (needs node, python3 with Pillow, google-chrome)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node "$ROOT/build/build.mjs"
python3 -I "$ROOT/build/thumbs.py" "$ROOT"
node "$ROOT/build/catalog.mjs"
mkdir -p "$ROOT/public/catalog"
google-chrome --headless=new --no-sandbox --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$ROOT/public/catalog/shristi-furniture-catalog.pdf" "file://$ROOT/build/out/catalog.html" 2>/dev/null
ls -lh "$ROOT/public/catalog/shristi-furniture-catalog.pdf"
