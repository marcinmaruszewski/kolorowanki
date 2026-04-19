#!/usr/bin/env bash
set -euo pipefail

# Upewnij się że .env istnieje (potrzebne dla docker compose)
if [ ! -f .env ]; then
  cp .env.example .env
  CREATED_ENV=1
else
  CREATED_ENV=0
fi

echo "==> docker compose config"
docker compose config --quiet

echo "==> docker compose build app"
docker compose build app

echo "==> docker compose up -d"
docker compose up -d

echo "==> Czekam na uruchomienie app..."
sleep 5

echo "==> Sprawdzam status usługi app"
APP_STATE=$(docker compose ps --format json app | python3 -c "import sys,json; data=sys.stdin.read().strip(); rows=data.splitlines(); first=json.loads(rows[0]); print(first.get('State',''))" 2>/dev/null || \
  docker compose ps app | awk 'NR==2{print $4}')
echo "   State: $APP_STATE"
if [[ "$APP_STATE" != "running" ]]; then
  echo "FAIL: usługa app nie jest w stanie running (State=$APP_STATE)"
  docker compose down
  exit 1
fi

echo "==> pnpm -v w kontenerze"
docker compose exec app pnpm -v

echo "==> node -v w kontenerze"
NODE_VER=$(docker compose exec app node -v)
echo "   Node: $NODE_VER"
if [[ "$NODE_VER" != v22* ]]; then
  echo "FAIL: oczekiwano node v22.x, dostałem $NODE_VER"
  docker compose down
  exit 1
fi

echo "==> bind mount działa"
docker compose exec app sh -c 'cat /app/package.json | head -1'

echo "==> echo test w kontenerze"
OUT=$(docker compose exec app sh -c 'echo OK')
if [[ "$OUT" != "OK" ]]; then
  echo "FAIL: echo OK nie zwróciło OK"
  docker compose down
  exit 1
fi

echo "==> docker compose down (idempotencja)"
docker compose down

# Posprzątaj .env jeśli go stworzyliśmy
if [ "$CREATED_ENV" -eq 1 ]; then
  rm -f .env
fi

echo "==> PASS: task 004 OK"
