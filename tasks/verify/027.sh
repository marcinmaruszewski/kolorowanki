#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 027: kreator nowego kalendarza ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
run_tsc

# Sprawdź pliki
echo "[2/4] Sprawdzam pliki"
require_files \
  "src/app/(app)/kalendarz/nowy/page.tsx" \
  "src/app/(app)/kalendarz/nowy/actions.ts"

assert_file_contains "src/app/(app)/kalendarz/nowy/actions.ts" 'use server' "actions.ts: brak 'use server'"
assert_file_contains "src/app/(app)/kalendarz/nowy/actions.ts" 'enqueueResearch' "actions.ts: brak enqueueResearch"
assert_file_contains "src/app/(app)/kalendarz/nowy/actions.ts" 'redirect' "actions.ts: brak redirect"
assert_file_contains "src/app/(app)/kalendarz/nowy/page.tsx" 'Styczeń|Stycze' "page.tsx: brak polskich nazw miesięcy"
assert_file_contains "src/app/(app)/kalendarz/nowy/page.tsx" 'Grudzień|Grudzie' "page.tsx: brak Grudzień"
assert_file_contains "src/app/(app)/kalendarz/nowy/page.tsx" 'CURRENT_YEAR \+ 1|getFullYear.*\+ 1|currentYear \+ 1' "page.tsx: brak opcji rok bieżący+1"
assert_file_contains "src/app/(app)/kalendarz/nowy/actions.ts" 'następnego miesiąca|nastepnego' "actions.ts: brak komunikatu o limicie"
assert_file_contains "src/app/(app)/kalendarz/nowy/actions.ts" 'już kalendarz na ten miesiąc' "actions.ts: brak komunikatu o duplikacie"

trap 'reset_compose_state' EXIT

echo "[3/3] Czysty stack + vitest"
reset_compose_state
start_compose_services postgres redis app
run_task_vitest tests/task-027 -e TEST_BASE_URL=http://127.0.0.1:3000 -e ENABLE_DEV_LOGIN=true

echo "=== verify 027: OK ==="
