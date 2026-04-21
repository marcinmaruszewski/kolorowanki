#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 035: fabric.js editor page ==="

echo "[1/3] tsc --noEmit"
run_tsc

echo "[2/3] Sprawdzam pliki i wzorce"
require_files \
  "src/app/(app)/kalendarz/[id]/edytor/page.tsx" \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "use client" \
  "fabric-canvas.tsx: brak 'use client'"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "FabricImage" \
  "fabric-canvas.tsx: brak FabricImage (fabric v6+ ESM import)"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "crossOrigin.*anonymous" \
  "fabric-canvas.tsx: brak crossOrigin: 'anonymous'"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "buildSlots" \
  "fabric-canvas.tsx: brak wywołania buildSlots"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  'id="fabric-canvas"' \
  "fabric-canvas.tsx: brak elementu canvas#fabric-canvas"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/page.tsx" \
  "FabricCanvas" \
  "page.tsx: brak komponentu FabricCanvas"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/page.tsx" \
  "status.*generated\|generated.*status" \
  "page.tsx: brak sprawdzania statusu generated"

echo "OK: pliki i wzorce"

echo "[3/3] fabric w package.json"
assert_file_contains "package.json" '"fabric"' "package.json: brak dependency 'fabric'"
echo "OK: fabric w package.json"

echo "=== verify 035: OK ==="
