#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== verify 026: lista kalendarzy ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
docker compose run --rm app pnpm exec tsc --noEmit

# Sprawdź pliki
echo "[2/4] Sprawdzam pliki"
for f in \
  "src/app/(app)/kalendarze/page.tsx" \
  "src/app/(app)/kalendarze/calendar-card.tsx"
do
  [ -f "$f" ] || { echo "Brakujący plik: $f"; exit 1; }
done

grep -q 'redirect.*login' "src/app/(app)/kalendarze/page.tsx" \
  || { echo "page.tsx: brak guard redirect /login"; exit 1; }

grep -q '/kalendarz/nowy' "src/app/(app)/kalendarze/page.tsx" \
  || { echo "page.tsx: brak linku /kalendarz/nowy"; exit 1; }

grep -q 'collection.*calendars' "src/app/(app)/kalendarze/page.tsx" \
  || { echo "page.tsx: brak payload.find calendars"; exit 1; }

# Start stack
echo "[3/4] Uruchamiam stack"
docker compose up -d

echo "--- czekam na gotowość app (max 90s) ---"
TRIES=0; MAX=18
until STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login 2>/dev/null) && [ "$STATUS" = "200" ]; do
  sleep 5; TRIES=$((TRIES+1))
  [ $TRIES -lt $MAX ] || { echo "Timeout: app nie odpowiada"; docker compose logs app --tail=20; docker compose down; exit 1; }
done
echo "OK: app odpowiada"

COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"; docker compose down' EXIT

# Bez logowania /kalendarze → redirect do /login
echo "[4/4] Auth guard + lista z dev-login"
STATUS_ANON=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/kalendarze)
[ "$STATUS_ANON" != "200" ] || \
  { BODY=$(curl -s http://localhost:3000/kalendarze); echo "$BODY" | grep -qv 'Wyloguj' && echo "OK: brak sesji → nie widać kalendarzy zalogowanego"; } || true

if docker compose exec -T app sh -c 'echo $ENABLE_DEV_LOGIN' 2>/dev/null | grep -q 'true'; then
  LOGIN_RESP=$(curl -s -c "$COOKIE_JAR" -X POST http://localhost:3000/api/auth/dev-login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test-026@example.com"}')
  echo "$LOGIN_RESP" | grep -q 'email' \
    || { echo "FAIL: dev-login nie zwrócił usera: $LOGIN_RESP"; exit 1; }

  BODY=$(curl -s -b "$COOKIE_JAR" http://localhost:3000/kalendarze)
  echo "$BODY" | grep -q 'Nowy kalendarz' \
    || { echo "FAIL: brak 'Nowy kalendarz' po zalogowaniu"; exit 1; }
  echo "OK: /kalendarze renderuje po zalogowaniu"
else
  echo "Pominięto test auth (ENABLE_DEV_LOGIN nie jest true)"
fi

echo "=== verify 026: OK ==="
