#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 029: edycja planu (okazja, motyw) ==="

echo "[1/4] tsc --noEmit"
run_tsc

echo "[2/4] Sprawdzam pliki"
require_files \
  "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" \
  "src/app/(app)/kalendarz/[id]/plan/actions.ts"

assert_file_contains "src/app/(app)/kalendarz/[id]/plan/actions.ts" 'use server' "actions.ts: brak 'use server'"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/actions.ts" 'updateDays' "actions.ts: brak updateDays"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/actions.ts" "generated" "actions.ts: brak guardu status=generated"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" 'use client' "plan-table.tsx: brak 'use client'"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" 'updateDays' "plan-table.tsx: brak wywołania updateDays"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" 'Zapisz zmiany' "plan-table.tsx: brak przycisku 'Zapisz zmiany'"

trap 'reset_compose_state' EXIT

echo "[3/4] Czysty stack + vitest"
reset_compose_state
start_compose_services postgres redis app
run_task_vitest tests/task-029 -e TEST_BASE_URL=http://127.0.0.1:3000 -e ENABLE_DEV_LOGIN=true

echo "[4/4] OK"
echo "=== verify 029: OK ==="
