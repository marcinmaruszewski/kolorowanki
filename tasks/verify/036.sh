#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 036: interakcje fabric.js ==="

echo "[1/3] tsc --noEmit"
run_tsc

echo "[2/3] Sprawdzam pliki i wzorce"
require_files \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "src/app/(app)/kalendarz/[id]/edytor/toolbar.tsx"

# fabric-canvas.tsx: selectable + hasControls
assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "selectable.*true" \
  "fabric-canvas.tsx: brak selectable: true"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "hasControls.*true" \
  "fabric-canvas.tsx: brak hasControls: true"

# snap do siatki
assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "object:moving" \
  "fabric-canvas.tsx: brak obsługi object:moving (snap do siatki)"

# undo/redo stack
assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "loadFromJSON" \
  "fabric-canvas.tsx: brak loadFromJSON (undo/redo)"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "object:modified" \
  "fabric-canvas.tsx: brak zapisu stanu po object:modified"

# shuffle i reset
assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "Shuffle|handleShuffle|onShuffle" \
  "fabric-canvas.tsx: brak obsługi Shuffle"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "handleReset|onReset" \
  "fabric-canvas.tsx: brak obsługi Reset"

# toolbar.tsx: przyciski
assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/toolbar.tsx" \
  "Przetasuj" \
  "toolbar.tsx: brak przycisku Przetasuj"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/toolbar.tsx" \
  "Reset" \
  "toolbar.tsx: brak przycisku Reset"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/toolbar.tsx" \
  "Cofnij" \
  "toolbar.tsx: brak przycisku Cofnij (Undo)"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/toolbar.tsx" \
  "Ponów" \
  "toolbar.tsx: brak przycisku Ponów (Redo)"

echo "OK: pliki i wzorce"

echo "[3/3] Toolbar importowany w FabricCanvas"
assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "Toolbar" \
  "fabric-canvas.tsx: brak importu/użycia Toolbar"

echo "OK: Toolbar wepnięty w FabricCanvas"

echo "=== verify 036: OK ==="
