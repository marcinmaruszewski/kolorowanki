#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 031: galeria obrazków ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
run_tsc

# Check files exist
echo "[2/4] Sprawdzam pliki"
require_files \
  "src/app/(app)/kalendarz/[id]/obrazki/page.tsx" \
  "src/app/(app)/kalendarz/[id]/obrazki/day-tile.tsx"

assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/page.tsx" 'day-grid' "page.tsx: brak klasy day-grid"
assert_file_contains "src/styles/globals.css" 'repeat.7' "globals.css: brak grid 7 kolumn"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/page.tsx" 'httpEquiv|http-equiv' "page.tsx: brak meta refresh"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/page.tsx" 'Generowanie w toku' "page.tsx: brak komunikatu Generowanie w toku"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/page.tsx" 'leadingCells' "page.tsx: brak obsługi wiodących pustych komórek"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/day-tile.tsx" '<img' "day-tile.tsx: brak tagu img"

echo "OK: wszystkie pliki i wzorce"

trap 'reset_compose_state' EXIT

echo "[3/4] Czysty stack + vitest"
reset_compose_state
start_compose_services postgres redis app
run_task_vitest tests/task-031 -e TEST_BASE_URL=http://127.0.0.1:3000 -e ENABLE_DEV_LOGIN=true

echo "=== verify 031: OK ==="
