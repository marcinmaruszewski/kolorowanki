#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 009: dev-login backdoor ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
run_tsc

# Check required files exist
echo "[2/4] Sprawdzam pliki"
for f in \
  "src/app/api/auth/dev-login/route.ts" \
  "src/instrumentation.ts"
do
  [ -f "$f" ] || fail "Brakujący plik: $f"
done

grep -q 'ENABLE_DEV_LOGIN' .env.example \
  || fail ".env.example: brak ENABLE_DEV_LOGIN"

grep -q 'NODE_ENV.*production' src/instrumentation.ts \
  || fail "instrumentation.ts: brak zabezpieczenia przed prod"

# Start clean stack
trap 'reset_compose_state' EXIT
reset_compose_state
start_compose_services postgres redis app

# Run tests
echo "[3/3] Vitest task-009"
run_task_vitest tests/task-009 -e TEST_BASE_URL=http://127.0.0.1:3000 -e ENABLE_DEV_LOGIN=true

echo "=== verify 009: OK ==="
