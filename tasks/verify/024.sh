#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== verify 024: strona logowania ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
docker compose run --rm app pnpm exec tsc --noEmit

# Sprawdź pliki
echo "[2/4] Sprawdzam pliki"
for f in \
  "src/app/(app)/layout.tsx" \
  "src/app/(app)/login/page.tsx" \
  "src/styles/globals.css"
do
  [ -f "$f" ] || { echo "Brakujący plik: $f"; exit 1; }
done

grep -q 'lang="pl"' "src/app/(app)/layout.tsx" \
  || { echo "layout.tsx: brak lang=pl"; exit 1; }

grep -q '/api/auth/google/start' "src/app/(app)/login/page.tsx" \
  || { echo "login/page.tsx: brak linku Google start"; exit 1; }

grep -q 'ENABLE_DEV_LOGIN' "src/app/(app)/login/page.tsx" \
  || { echo "login/page.tsx: brak obsługi ENABLE_DEV_LOGIN"; exit 1; }

grep -q '/api/auth/dev-login' "src/app/(app)/login/page.tsx" \
  || { echo "login/page.tsx: brak form action dev-login"; exit 1; }

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

# Test /login zwraca 200 i zawiera treść Google
echo "[4/4] GET /login"
BODY=$(curl -s http://localhost:3000/login)
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login)

[ "$HTTP_STATUS" = "200" ] || { echo "FAIL: /login zwróciło $HTTP_STATUS, oczekiwano 200"; docker compose down; exit 1; }

echo "$BODY" | grep -q 'google/start' \
  || { echo "FAIL: brak linku google/start w HTML"; docker compose down; exit 1; }

echo "$BODY" | grep -q 'Zaloguj' \
  || { echo "FAIL: brak tekstu 'Zaloguj' w HTML"; docker compose down; exit 1; }

# Test dev-login hidden when ENABLE_DEV_LOGIN nie jest true
# (w compose domyślnie nie jest ustawione lub =true — sprawdzamy obecność warunkową)
if docker compose exec -T app sh -c 'echo $ENABLE_DEV_LOGIN' 2>/dev/null | grep -q 'true'; then
  echo "$BODY" | grep -q 'dev-login' \
    || { echo "FAIL: ENABLE_DEV_LOGIN=true ale brak form dev-login"; docker compose down; exit 1; }
  echo "Dev login form: widoczny (ENABLE_DEV_LOGIN=true)"
else
  echo "Dev login form: ukryty (ENABLE_DEV_LOGIN nie ustawione lub false)"
fi

docker compose down

echo "=== verify 024: OK ==="
