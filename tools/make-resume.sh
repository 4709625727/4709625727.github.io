#!/bin/bash
# Renders resume.pdf from resume.html with headless Chrome.
set -e
cd "$(dirname "$0")/.."
node build.js >/dev/null
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "Chrome not found. Set CHROME=/path/to/chrome"; exit 1; }
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PWD/resume.pdf" --virtual-time-budget=5000 \
  "file://$PWD/resume.html" >/dev/null 2>&1
echo "  resume.pdf written ($(du -h resume.pdf | cut -f1))"
