#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== verify 006: users collection ==="

# 1. Check required files
FILES=(
  "src/payload/collections/users.ts"
  "src/payload.config.ts"
  "src/payload-types.ts"
)

for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "FAIL: missing file $f"
    exit 1
  fi
done
echo "OK: all required files present"

# 2. TypeScript check
echo "--- tsc --noEmit ---"
docker compose run --rm app pnpm exec tsc --noEmit
echo "OK: tsc --noEmit passed"

# 3. Verify types contain role field
if ! grep -q "role: 'user' | 'admin'" src/payload-types.ts; then
  echo "FAIL: payload-types.ts does not contain role: 'user' | 'admin'"
  exit 1
fi
echo "OK: payload-types.ts contains role field"

# 4. Verify Users is registered in payload.config.ts
if ! grep -q "Users" src/payload.config.ts; then
  echo "FAIL: Users collection not registered in payload.config.ts"
  exit 1
fi
echo "OK: Users registered in payload.config.ts"

# 5. Start stack and wait for app
echo "--- starting stack ---"
docker compose up -d

echo "--- waiting for app to be ready (max 120s) ---"
TRIES=0
MAX=24
until STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users 2>/dev/null) && [ -n "$STATUS" ] && [ "$STATUS" != "000" ]; do
  sleep 5
  TRIES=$((TRIES + 1))
  if [ $TRIES -ge $MAX ]; then
    echo "FAIL: app did not respond on http://localhost:3000 after 120s"
    docker compose logs app --tail=30
    docker compose down
    exit 1
  fi
done
echo "OK: app is responding (HTTP $STATUS)"

# 6. Run integration tests
echo "--- running vitest integration tests ---"
docker compose run --rm -e TEST_BASE_URL=http://app:3000 app pnpm vitest run tests/task-006
VITEST_EXIT=$?

docker compose down

if [ $VITEST_EXIT -ne 0 ]; then
  echo "FAIL: vitest tests failed"
  exit 1
fi

echo "=== verify 006 PASSED ==="
