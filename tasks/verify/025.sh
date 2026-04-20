#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== verify 025: layout + nawigacja auth-aware ==="

# TypeScript check
echo "[1/5] tsc --noEmit"
docker compose run --rm app pnpm exec tsc --noEmit

# Sprawdź pliki
echo "[2/5] Sprawdzam pliki"
for f in \
  "src/app/(app)/layout.tsx" \
  "src/components/nav-bar.tsx" \
  "src/lib/auth/current-user.ts"
do
  [ -f "$f" ] || { echo "Brakujący plik: $f"; exit 1; }
done

grep -q 'NavBar' "src/app/(app)/layout.tsx" \
  || { echo "layout.tsx: brak NavBar"; exit 1; }

grep -q 'getCurrentUser' "src/components/nav-bar.tsx" \
  || { echo "nav-bar.tsx: brak getCurrentUser"; exit 1; }

grep -q 'Wyloguj' "src/components/nav-bar.tsx" \
  || { echo "nav-bar.tsx: brak tekstu Wyloguj"; exit 1; }

grep -q 'Zaloguj' "src/components/nav-bar.tsx" \
  || { echo "nav-bar.tsx: brak tekstu Zaloguj"; exit 1; }

grep -q 'getCurrentUser' "src/lib/auth/current-user.ts" \
  || { echo "current-user.ts: brak getCurrentUser"; exit 1; }

# Start stack
echo "[3/5] Uruchamiam stack"
docker compose up -d

echo "--- czekam na gotowość app (max 90s) ---"
TRIES=0; MAX=18
until STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null) && [ "$STATUS" != "000" ] && [ -n "$STATUS" ]; do
  sleep 5; TRIES=$((TRIES+1))
  [ $TRIES -lt $MAX ] || { echo "Timeout: app nie odpowiada"; docker compose logs app --tail=20; docker compose down; exit 1; }
done
echo "OK: app odpowiada (HTTP $STATUS)"

COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"; docker compose down' EXIT

# Test topbar bez logowania na /login (jest w (app) group → ma NavBar)
echo "[4/5] Topbar bez sesji"
BODY_ANON=$(curl -s http://localhost:3000/login)
echo "$BODY_ANON" | grep -q 'Zaloguj' \
  || { echo "FAIL: brak 'Zaloguj' w HTML bez sesji"; exit 1; }

# Dev login → sprawdź topbar z sesją
echo "[5/5] Dev login + topbar z sesją"
if docker compose exec -T app sh -c 'echo $ENABLE_DEV_LOGIN' 2>/dev/null | grep -q 'true'; then
  LOGIN_RESP=$(curl -s -c "$COOKIE_JAR" -X POST http://localhost:3000/api/auth/dev-login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test-nav@example.com"}')
  echo "$LOGIN_RESP" | grep -q 'email' \
    || { echo "FAIL: dev-login nie zwrócił usera: $LOGIN_RESP"; exit 1; }

  BODY_AUTH=$(curl -s -b "$COOKIE_JAR" http://localhost:3000/login)
  echo "$BODY_AUTH" | grep -q 'Wyloguj' \
    || { echo "FAIL: brak 'Wyloguj' w HTML po zalogowaniu"; exit 1; }

  # Wyloguj — POST na Payload logout endpoint
  curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST http://localhost:3000/api/users/logout > /dev/null

  # Po wylogowaniu cookie powinno być nieważne → NavBar znów pokazuje Zaloguj
  BODY_AFTER=$(curl -s -b "$COOKIE_JAR" http://localhost:3000/login)
  echo "$BODY_AFTER" | grep -q 'Zaloguj' \
    || { echo "FAIL: brak 'Zaloguj' po wylogowaniu"; exit 1; }

  echo "OK: auth-aware nav działa"
else
  echo "Pominięto test auth (ENABLE_DEV_LOGIN nie jest true)"
fi

echo "=== verify 025: OK ==="
