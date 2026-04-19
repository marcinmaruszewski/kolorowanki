#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

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
docker compose up -d postgres redis

echo "=== [003] Czekam na healthy (max 60s) ==="
TIMEOUT=60
ELAPSED=0
while true; do
  PG_STATUS=$(docker compose ps postgres --format json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['Health'] if isinstance(d, list) else d.get('Health',''))" 2>/dev/null || echo "")
  RD_STATUS=$(docker compose ps redis --format json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['Health'] if isinstance(d, list) else d.get('Health',''))" 2>/dev/null || echo "")
  if [ "$PG_STATUS" = "healthy" ] && [ "$RD_STATUS" = "healthy" ]; then
    echo "Oba serwisy healthy."
    break
  fi
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "BŁĄD: serwisy nie osiągnęły stanu healthy w ${TIMEOUT}s (postgres=$PG_STATUS redis=$RD_STATUS)"
    docker compose down
    exit 1
  fi
  sleep 3
  ELAPSED=$((ELAPSED + 3))
done

echo "=== [003] Testuję połączenie z Postgres ==="
RESULT=$(docker compose exec -T postgres psql -U "$POSTGRES_USER" -d kalendarz -t -c 'SELECT 1;' 2>&1 | tr -d ' \n')
if [ "$RESULT" != "1" ]; then
  echo "BŁĄD: psql SELECT 1 zwrócił: $RESULT"
  docker compose down
  exit 1
fi
echo "Postgres OK (SELECT 1 = 1)"

echo "=== [003] Testuję połączenie z Redis ==="
PING=$(docker compose exec -T redis redis-cli ping 2>&1 | tr -d '\r\n')
if [ "$PING" != "PONG" ]; then
  echo "BŁĄD: redis-cli ping zwrócił: $PING"
  docker compose down
  exit 1
fi
echo "Redis OK (PONG)"

echo "=== [003] Sprzątam (docker compose down) ==="
docker compose down

echo "=== [003] PASS ==="
