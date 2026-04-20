#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

# Upewnij się że .env istnieje (potrzebne dla docker compose)
if [ ! -f .env ]; then
  cp .env.example .env
  CREATED_ENV=1
else
  CREATED_ENV=0
fi

cleanup() {
  reset_compose_state
  if [ "$CREATED_ENV" -eq 1 ]; then
    rm -f .env
  fi
}

trap cleanup EXIT

echo "==> docker compose config"
docker compose config --quiet

echo "==> docker compose build app"
docker compose build app

echo "==> start clean stack"
reset_compose_state
start_compose_services postgres redis app

echo "==> Sprawdzam status usługi app"
wait_for_service_state app running
APP_STATE="$(compose_service_field app State)"
echo "   State: $APP_STATE"
if [[ "$APP_STATE" != "running" ]]; then
  echo "FAIL: usługa app nie jest w stanie running (State=$APP_STATE)"
  exit 1
fi

echo "==> pnpm -v w kontenerze"
exec_in_service app pnpm -v

echo "==> node -v w kontenerze"
NODE_VER=$(exec_in_service app node -v)
echo "   Node: $NODE_VER"
if [[ "$NODE_VER" != v22* ]]; then
  echo "FAIL: oczekiwano node v22.x, dostałem $NODE_VER"
  exit 1
fi

echo "==> bind mount działa"
exec_in_service app sh -c 'cat /app/package.json | head -1'

echo "==> echo test w kontenerze"
OUT=$(exec_in_service app sh -c 'echo OK' | tr -d '\r')
if [[ "$OUT" != "OK" ]]; then
  echo "FAIL: echo OK nie zwróciło OK"
  exit 1
fi

echo "==> PASS: task 004 OK"
