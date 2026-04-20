#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 025: layout + nawigacja auth-aware ==="

# TypeScript check
echo "[1/5] tsc --noEmit"
run_tsc

# Sprawdź pliki
echo "[2/5] Sprawdzam pliki"
require_files \
  "src/app/(app)/layout.tsx" \
  "src/components/nav-bar.tsx" \
  "src/lib/auth/current-user.ts"

assert_file_contains "src/app/(app)/layout.tsx" 'NavBar' "layout.tsx: brak NavBar"
assert_file_contains "src/components/nav-bar.tsx" 'getCurrentUser' "nav-bar.tsx: brak getCurrentUser"
assert_file_contains "src/components/nav-bar.tsx" 'Wyloguj' "nav-bar.tsx: brak tekstu Wyloguj"
assert_file_contains "src/components/nav-bar.tsx" 'Zaloguj' "nav-bar.tsx: brak tekstu Zaloguj"
assert_file_contains "src/lib/auth/current-user.ts" 'getCurrentUser' "current-user.ts: brak getCurrentUser"

trap 'reset_compose_state' EXIT

echo "[3/3] Czysty stack + vitest"
reset_compose_state
start_compose_services postgres redis app
run_task_vitest tests/task-025 -e TEST_BASE_URL=http://127.0.0.1:3000 -e ENABLE_DEV_LOGIN=true

echo "=== verify 025: OK ==="
