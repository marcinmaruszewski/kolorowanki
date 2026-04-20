#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 006: users collection ==="

# 1. Check required files
FILES=(
  "src/payload/collections/users.ts"
  "src/payload.config.ts"
  "src/payload-types.ts"
)

for f in "${FILES[@]}"; do
  [[ -f "$f" ]] || fail "missing file $f"
done
echo "OK: all required files present"

# 2. TypeScript check
run_tsc
echo "OK: tsc --noEmit passed"

# 3. Verify types contain role field
grep -q "role: 'user' | 'admin'" src/payload-types.ts \
  || fail "payload-types.ts does not contain role: 'user' | 'admin'"
echo "OK: payload-types.ts contains role field"

# 4. Verify Users is registered in payload.config.ts
grep -q "Users" src/payload.config.ts || fail "Users collection not registered in payload.config.ts"
echo "OK: Users registered in payload.config.ts"

# 5. Start clean stack and run integration tests
trap 'reset_compose_state' EXIT
reset_compose_state
start_compose_services postgres redis app

echo "--- running vitest integration tests ---"
run_task_vitest tests/task-006 -e TEST_BASE_URL=http://127.0.0.1:3000 -e ENABLE_DEV_LOGIN=true

echo "=== verify 006 PASSED ==="
