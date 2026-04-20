#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"
source "$REPO_ROOT/tasks/verify/_helpers.sh"

# Load .env if it exists, otherwise use .env.example values
if [ -f .env ]; then
  set -a; source .env; set +a
else
  export POSTGRES_USER=kalendarz
  export POSTGRES_PASSWORD=change-me-locally
  export DATABASE_URL="postgres://kalendarz:change-me-locally@localhost:5432/kalendarz"
  export REDIS_URL="redis://localhost:6379"
fi

echo "=== [003] Sprawdzam docker compose config ==="
docker compose config > /dev/null

echo "=== [003] Uruchamiam postgres i redis ==="
trap 'reset_compose_state' EXIT
reset_compose_state
start_compose_services postgres redis

echo "=== [003] Czekam na healthy ==="
wait_for_service_health postgres
wait_for_service_health redis
echo "Oba serwisy healthy."

echo "=== [003] Testuję połączenie z Postgres ==="
RESULT=$(exec_in_service postgres psql -U "$POSTGRES_USER" -d kalendarz -t -c 'SELECT 1;' 2>&1 | tr -d ' \n')
if [ "$RESULT" != "1" ]; then
  echo "BŁĄD: psql SELECT 1 zwrócił: $RESULT"
  exit 1
fi
echo "Postgres OK (SELECT 1 = 1)"

echo "=== [003] Testuję połączenie z Redis ==="
PING=$(exec_in_service redis redis-cli ping 2>&1 | tr -d '\r\n')
if [ "$PING" != "PONG" ]; then
  echo "BŁĄD: redis-cli ping zwrócił: $PING"
  exit 1
fi
echo "Redis OK (PONG)"

echo "=== [003] PASS ==="
