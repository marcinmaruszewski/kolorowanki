#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== verify 005: Payload v3 + Next.js install ==="

# 1. Check required files exist
FILES=(
  "package.json"
  "pnpm-lock.yaml"
  "next.config.mjs"
  "tsconfig.json"
  "docker-compose.yml"
  "src/app/(payload)/layout.tsx"
  "src/app/(payload)/admin/[[...segments]]/page.tsx"
  "src/app/(payload)/admin/[[...segments]]/not-found.tsx"
  "src/app/(payload)/api/[...slug]/route.ts"
  "src/app/(payload)/api/graphql/route.ts"
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

# 3. Check payload and next are in package.json
if ! grep -q '"payload"' package.json; then
  echo "FAIL: payload not found in package.json"
  exit 1
fi
if ! grep -q '"next"' package.json; then
  echo "FAIL: next not found in package.json"
  exit 1
fi
echo "OK: payload and next in package.json"

# 4. Check pnpm dev script
if ! grep -q '"dev"' package.json; then
  echo "FAIL: dev script not in package.json"
  exit 1
fi
echo "OK: dev script present"

# 5. Check docker-compose has pnpm dev command for app
if ! grep -q 'pnpm.*dev\|dev.*pnpm' docker-compose.yml; then
  echo "FAIL: pnpm dev command not found in docker-compose.yml for app service"
  exit 1
fi
echo "OK: docker-compose.yml has pnpm dev command"

# 6. Check tsconfig has @payload-config path
if ! grep -q '@payload-config' tsconfig.json; then
  echo "FAIL: @payload-config path not found in tsconfig.json"
  exit 1
fi
echo "OK: @payload-config path alias present in tsconfig.json"

# 7. Start stack and verify app responds
echo "--- starting stack ---"
docker compose up -d

echo "--- waiting for app to be ready (max 90s) ---"
TRIES=0
MAX=18
until STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null) && [ -n "$STATUS" ] && [ "$STATUS" != "000" ]; do
  sleep 5
  TRIES=$((TRIES + 1))
  if [ $TRIES -ge $MAX ]; then
    echo "FAIL: app did not respond on http://localhost:3000 after 90s"
    docker compose logs app --tail=30
    docker compose down
    exit 1
  fi
done
echo "OK: app is responding on http://localhost:3000 (HTTP $STATUS)"

# 8. Check /admin returns 2xx or 3xx (no -L: 307 redirect to create-first-user is expected)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin)
if ! echo "$STATUS" | grep -qE "^[23]"; then
  echo "FAIL: /admin returned HTTP $STATUS"
  docker compose down
  exit 1
fi
echo "OK: /admin returned HTTP $STATUS"

docker compose down
echo "=== verify 005 PASSED ==="
