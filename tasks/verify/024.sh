#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 024: strona logowania ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
run_tsc

# Sprawdź pliki
echo "[2/4] Sprawdzam pliki"
require_files \
  "src/app/(app)/layout.tsx" \
  "src/app/(app)/login/page.tsx" \
  "src/styles/globals.css"

assert_file_contains "src/app/(app)/layout.tsx" 'lang="pl"' "layout.tsx: brak lang=pl"
assert_file_contains "src/app/(app)/login/page.tsx" '/api/auth/google/start' "login/page.tsx: brak linku Google start"
assert_file_contains "src/app/(app)/login/page.tsx" 'ENABLE_DEV_LOGIN' "login/page.tsx: brak obsługi ENABLE_DEV_LOGIN"
assert_file_contains "src/app/(app)/login/page.tsx" '/api/auth/dev-login' "login/page.tsx: brak form action dev-login"

SESSION="verify-024-$$"
trap 'close_browser_session "$SESSION"; reset_compose_state' EXIT

echo "[3/4] Uruchamiam czysty stack"
reset_compose_state
start_compose_services postgres redis app

echo "[4/4] Vitest + browser smoke"
run_task_vitest tests/task-024 -e TEST_BASE_URL=http://127.0.0.1:3000 -e ENABLE_DEV_LOGIN=true
browser_wait_for_page "$SESSION" "http://127.0.0.1:3000/login"
assert_browser_main_contains "$SESSION" "Zaloguj przez Google"

echo "=== verify 024: OK ==="
