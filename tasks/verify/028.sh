#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 028: strona planu kalendarza ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
run_tsc

# Check files exist
echo "[2/4] Sprawdzam pliki"
require_files \
  "src/app/(app)/kalendarz/[id]/plan/page.tsx" \
  "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx"

assert_file_contains "src/app/(app)/kalendarz/[id]/plan/page.tsx" 'draft' "page.tsx: brak obsługi statusu draft"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/page.tsx" 'http-equiv|httpEquiv' "page.tsx: brak meta refresh"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/page.tsx" 'Generujemy plan' "page.tsx: brak komunikatu Generujemy plan"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/page.tsx" 'disabled' "page.tsx: przycisk Dalej powinien być disabled"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" 'Dzień|Dzie' "plan-table.tsx: brak kolumny Dzień"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" 'Okazja' "plan-table.tsx: brak kolumny Okazja"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" 'Motyw' "plan-table.tsx: brak kolumny Motyw"

echo "OK: wszystkie pliki i wzorce"

trap 'reset_compose_state' EXIT

echo "[3/3] Czysty stack + vitest"
reset_compose_state
start_compose_services postgres redis app
run_task_vitest tests/task-028 -e TEST_BASE_URL=http://127.0.0.1:3000 -e ENABLE_DEV_LOGIN=true

echo "=== verify 028: OK ==="
