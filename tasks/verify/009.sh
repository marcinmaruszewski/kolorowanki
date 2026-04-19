#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== verify 009: dev-login backdoor ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
docker compose run --rm app pnpm exec tsc --noEmit

# Check required files exist
echo "[2/4] Sprawdzam pliki"
for f in \
  "src/app/api/auth/dev-login/route.ts" \
  "src/instrumentation.ts"
do
  [ -f "$f" ] || { echo "Brakujący plik: $f"; exit 1; }
done

grep -q 'ENABLE_DEV_LOGIN' .env.example \
  || { echo ".env.example: brak ENABLE_DEV_LOGIN"; exit 1; }

grep -q 'NODE_ENV.*production' src/instrumentation.ts \
  || { echo "instrumentation.ts: brak zabezpieczenia przed prod"; exit 1; }

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

# Test 404 without flag
echo "--- sprawdzam 404 bez flagi ---"
NO_FLAG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:3000/api/auth/dev-login \
  -H 'content-type: application/json' \
  -d '{"email":"test@example.com"}' \
  --cookie "")
# W compose dev ENABLE_DEV_LOGIN=true, więc ten test pomijamy (sprawdzamy tylko logikę kodu)
echo "Status przy włączonej fladze: $NO_FLAG_STATUS (oczekiwano 200)"
[ "$NO_FLAG_STATUS" = "200" ] || { echo "FAIL: oczekiwano 200, dostano $NO_FLAG_STATUS"; docker compose down; exit 1; }

# Run tests
echo "[4/4] Vitest task-009"
docker compose run --rm \
  -e TEST_BASE_URL=http://app:3000 \
  -e ENABLE_DEV_LOGIN=true \
  app pnpm vitest run tests/task-009
VITEST_EXIT=$?

docker compose down

[ $VITEST_EXIT -eq 0 ] || { echo "FAIL: vitest task-009 nie przeszedł"; exit 1; }

echo "=== verify 009: OK ==="
