#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 026: lista kalendarzy ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
run_tsc

# Sprawdź pliki
echo "[2/4] Sprawdzam pliki"
require_files \
  "src/app/(app)/kalendarze/page.tsx" \
  "src/app/(app)/kalendarze/calendar-card.tsx"

assert_file_contains "src/app/(app)/kalendarze/page.tsx" 'redirect.*login' "page.tsx: brak guard redirect /login"
assert_file_contains "src/app/(app)/kalendarze/page.tsx" '/kalendarz/nowy' "page.tsx: brak linku /kalendarz/nowy"
assert_file_contains "src/app/(app)/kalendarze/page.tsx" 'collection.*calendars' "page.tsx: brak payload.find calendars"

SESSION="verify-026-$$"
trap 'close_browser_session "$SESSION"; reset_compose_state' EXIT

echo "[3/4] Czysty stack"
reset_compose_state
start_compose_services postgres redis app

echo "[4/4] Vitest + browser smoke redirectu"
run_task_vitest tests/task-026 -e TEST_BASE_URL=http://127.0.0.1:3000 -e ENABLE_DEV_LOGIN=true
browser_wait_for_page "$SESSION" "http://127.0.0.1:3000/kalendarze"
assert_browser_main_contains "$SESSION" "Zaloguj się, żeby wygenerować kalendarz kolorowanek"

echo "=== verify 026: OK ==="
