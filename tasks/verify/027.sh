#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== verify 027: kreator nowego kalendarza ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
docker compose run --rm app pnpm exec tsc --noEmit

# Sprawdź pliki
echo "[2/4] Sprawdzam pliki"
for f in \
  "src/app/(app)/kalendarz/nowy/page.tsx" \
  "src/app/(app)/kalendarz/nowy/actions.ts"
do
  [ -f "$f" ] || { echo "Brakujący plik: $f"; exit 1; }
done

grep -q 'use server' "src/app/(app)/kalendarz/nowy/actions.ts" \
  || { echo "actions.ts: brak 'use server'"; exit 1; }

grep -q 'enqueueResearch' "src/app/(app)/kalendarz/nowy/actions.ts" \
  || { echo "actions.ts: brak enqueueResearch"; exit 1; }

grep -q 'redirect' "src/app/(app)/kalendarz/nowy/actions.ts" \
  || { echo "actions.ts: brak redirect"; exit 1; }

grep -q 'Styczeń\|Stycze' "src/app/(app)/kalendarz/nowy/page.tsx" \
  || { echo "page.tsx: brak polskich nazw miesięcy"; exit 1; }

grep -q 'Grudzień\|Grudzie' "src/app/(app)/kalendarz/nowy/page.tsx" \
  || { echo "page.tsx: brak Grudzień"; exit 1; }

grep -q 'CURRENT_YEAR + 1\|getFullYear.*+ 1\|currentYear + 1' "src/app/(app)/kalendarz/nowy/page.tsx" \
  || { echo "page.tsx: brak opcji rok bieżący+1"; exit 1; }

grep -q 'następnego miesiąca\|nastepnego' "src/app/(app)/kalendarz/nowy/actions.ts" \
  || { echo "actions.ts: brak komunikatu o limicie"; exit 1; }

grep -q 'już kalendarz na ten miesiąc' "src/app/(app)/kalendarz/nowy/actions.ts" \
  || { echo "actions.ts: brak komunikatu o duplikacie"; exit 1; }

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

echo "[4/4] E2E: strona kreatora dostępna po zalogowaniu"
if docker compose exec -T app sh -c 'echo $ENABLE_DEV_LOGIN' 2>/dev/null | grep -q 'true'; then
  LOGIN_RESP=$(curl -s -c "$COOKIE_JAR" -X POST http://localhost:3000/api/auth/dev-login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test-027@example.com"}')
  echo "$LOGIN_RESP" | grep -q 'email' \
    || { echo "FAIL: dev-login nie zwrócił usera: $LOGIN_RESP"; exit 1; }

  BODY=$(curl -s -b "$COOKIE_JAR" http://localhost:3000/kalendarz/nowy)
  echo "$BODY" | grep -qi 'Styczeń\|Nowy kalendarz\|nowy' \
    || { echo "FAIL: /kalendarz/nowy nie renderuje kreatora"; exit 1; }
  echo "OK: /kalendarz/nowy renderuje po zalogowaniu"
else
  echo "Pominięto test auth (ENABLE_DEV_LOGIN nie jest true)"
fi

echo "=== verify 027: OK ==="
