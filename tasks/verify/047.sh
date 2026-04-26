#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 047: docker-compose.prod.yml ==="

echo "[1/3] Sprawdzam pliki"
require_files \
  "docker-compose.prod.yml" \
  ".env.production.example"

echo "[2/3] Sprawdzam wzorce docker-compose.prod.yml"
DC="docker-compose.prod.yml"

assert_file_contains "$DC" \
  "Dockerfile\.prod" \
  "docker-compose.prod.yml: brak Dockerfile.prod dla serwisu app"

assert_file_contains "$DC" \
  "Dockerfile\.worker" \
  "docker-compose.prod.yml: brak Dockerfile.worker dla serwisu worker"

assert_file_contains "$DC" \
  "postgres:16-alpine" \
  "docker-compose.prod.yml: brak serwisu postgres"

assert_file_contains "$DC" \
  "redis:7-alpine" \
  "docker-compose.prod.yml: brak serwisu redis"

assert_file_contains "$DC" \
  "restart: unless-stopped" \
  "docker-compose.prod.yml: brak restart policy"

assert_file_contains "$DC" \
  "postgres_data" \
  "docker-compose.prod.yml: brak named volume postgres_data"

assert_file_contains "$DC" \
  "3000:3000" \
  "docker-compose.prod.yml: brak mapowania portu 3000"

echo "OK: wzorce"

echo "[3/3] docker compose config — walidacja składni"
# Create temp .env.production so compose env_file: directive resolves
sed 's/=$/=placeholder/' .env.production.example > .env.production
trap 'rm -f .env.production' EXIT

POSTGRES_USER=test POSTGRES_PASSWORD=test \
  docker compose -f docker-compose.prod.yml config --quiet

echo "OK: docker compose config"

echo "=== verify 047: OK ==="
