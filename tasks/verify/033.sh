#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 033: licznik regeneracji ==="

echo "[1/3] tsc --noEmit"
run_tsc

echo "[2/3] Sprawdzam pliki i wzorce"
require_files \
  "src/lib/quota/regenerations.ts" \
  "src/app/(app)/kalendarz/[id]/obrazki/regenerate-counter.tsx"

assert_file_contains "src/lib/quota/regenerations.ts" 'countRegenerationsUsed' "regenerations.ts: brak funkcji countRegenerationsUsed"
assert_file_contains "src/lib/quota/regenerations.ts" 'single-image' "regenerations.ts: brak filtrowania po type single-image"
assert_file_contains "src/lib/quota/regenerations.ts" 'failed' "regenerations.ts: brak wykluczania statusu failed"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/regenerate-counter.tsx" 'RegenerateCounter' "regenerate-counter.tsx: brak komponentu RegenerateCounter"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/regenerate-counter.tsx" 'regeneracji z' "regenerate-counter.tsx: brak tekstu licznika"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/page.tsx" 'countRegenerationsUsed' "page.tsx: brak wywołania countRegenerationsUsed"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/page.tsx" 'RegenerateCounter' "page.tsx: brak komponentu RegenerateCounter"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/page.tsx" 'regenDisabled' "page.tsx: brak przekazania regenDisabled"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/day-tile.tsx" 'regenDisabled' "day-tile.tsx: brak props regenDisabled"
assert_file_contains "src/styles/globals.css" 'regen-counter' "globals.css: brak stylów licznika"

echo "OK: pliki i wzorce"

trap 'reset_compose_state' EXIT

echo "[3/3] Czysty stack + vitest (helper liczący)"
reset_compose_state
start_compose_services postgres redis app
run_task_vitest tests/task-033

echo "=== verify 033: OK ==="
