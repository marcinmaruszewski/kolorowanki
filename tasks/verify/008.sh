#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== verify 008: Google OAuth strategy ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
docker compose run --rm app pnpm exec tsc --noEmit

# Check required files exist
echo "[2/4] Sprawdzam pliki"
for f in \
  src/lib/auth/google.ts \
  "src/app/api/auth/google/start/route.ts" \
  "src/app/api/auth/google/callback/route.ts"
do
  [ -f "$f" ] || { echo "Brakujący plik: $f"; exit 1; }
done

# Ensure access.create blocks production REST creation
grep -q 'ENABLE_DEV_LOGIN' src/payload/collections/users.ts \
  || { echo "users.ts: access.create powinno blokować REST w produkcji"; exit 1; }

# Start stack
echo "[3/4] Uruchamiam stack"
docker compose up -d

echo "--- czekam na gotowość app (max 90s) ---"
TRIES=0; MAX=18
until STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null) && [ "$STATUS" != "000" ] && [ -n "$STATUS" ]; do
  sleep 5; TRIES=$((TRIES+1))
  [ $TRIES -lt $MAX ] || { echo "Timeout: app nie odpowiada"; docker compose logs app --tail=20; docker compose down; exit 1; }
done
echo "OK: app odpowiada (HTTP $STATUS)"

# Run tests
echo "[4/4] Vitest task-008"
docker compose run --rm \
  -e TEST_BASE_URL=http://app:3000 \
  -e ENABLE_DEV_LOGIN=true \
  app pnpm vitest run tests/task-008
VITEST_EXIT=$?

docker compose down

[ $VITEST_EXIT -eq 0 ] || { echo "FAIL: vitest task-008 nie przeszedł"; exit 1; }

echo "=== verify 008: OK ==="
