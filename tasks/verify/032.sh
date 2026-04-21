#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 032: modal regeneracji dnia ==="

echo "[1/4] tsc --noEmit"
run_tsc

echo "[2/4] Sprawdzam pliki"
require_files \
  "src/app/(app)/kalendarz/[id]/obrazki/regenerate-modal.tsx" \
  "src/app/(app)/kalendarz/[id]/obrazki/actions.ts"

assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/actions.ts" 'regenerateDay' "actions.ts: brak funkcji regenerateDay"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/actions.ts" 'REGEN_LIMIT' "actions.ts: brak stałej limitu regeneracji"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/regenerate-modal.tsx" 'RegenerateModal' "regenerate-modal.tsx: brak komponentu RegenerateModal"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/regenerate-modal.tsx" 'textarea' "regenerate-modal.tsx: brak textarea z promptem"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/regenerate-modal.tsx" 'spinner' "regenerate-modal.tsx: brak spinnera"
assert_file_contains "src/app/(app)/kalendarz/[id]/obrazki/day-tile.tsx" 'RegenerateModal' "day-tile.tsx: brak podpięcia modala"
assert_file_contains "src/styles/globals.css" 'modal-overlay' "globals.css: brak stylów modala"

echo "OK: pliki i wzorce"

trap 'reset_compose_state' EXIT

echo "[3/4] Czysty stack + vitest (Server Action — mocki BullMQ)"
reset_compose_state
start_compose_services postgres redis app
run_task_vitest tests/task-032 -e TEST_BASE_URL=http://127.0.0.1:3000 -e ENABLE_DEV_LOGIN=true

echo "=== verify 032: OK ==="
