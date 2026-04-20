#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 008: Google OAuth strategy ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
run_tsc

# Check required files exist
echo "[2/4] Sprawdzam pliki"
for f in \
  src/lib/auth/google.ts \
  "src/app/api/auth/google/start/route.ts" \
  "src/app/api/auth/google/callback/route.ts"
do
  [ -f "$f" ] || fail "Brakujący plik: $f"
done

# Ensure access.create blocks production REST creation
grep -q 'ENABLE_DEV_LOGIN' src/payload/collections/users.ts \
  || fail "users.ts: access.create powinno blokować REST w produkcji"

# Start clean stack
trap 'reset_compose_state' EXIT
reset_compose_state
start_compose_services postgres redis app

# Run tests
echo "[3/3] Vitest task-008"
run_task_vitest tests/task-008 -e TEST_BASE_URL=http://127.0.0.1:3000 -e ENABLE_DEV_LOGIN=true

echo "=== verify 008: OK ==="
