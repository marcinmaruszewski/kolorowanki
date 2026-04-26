#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 046: Production Dockerfile dla workera ==="

echo "[1/3] Sprawdzam pliki"
require_files "Dockerfile.worker"

echo "[2/3] Sprawdzam wzorce Dockerfile.worker"
DF="Dockerfile.worker"

assert_file_contains "$DF" \
  "FROM node:22-alpine AS deps" \
  "Dockerfile.worker: brak stage deps"

assert_file_contains "$DF" \
  "pnpm install --frozen-lockfile" \
  "Dockerfile.worker: brak pnpm install --frozen-lockfile"

assert_file_contains "$DF" \
  "FROM node:22-alpine AS runner" \
  "Dockerfile.worker: brak stage runner"

assert_file_contains "$DF" \
  "src/jobs/worker-entry" \
  "Dockerfile.worker: brak odwołania do worker-entry"

echo "OK: wzorce Dockerfile.worker"

echo "[3/3] Docker build"
IMAGE_TAG="kolorowanki-worker:verify-046"

docker build \
  --file Dockerfile.worker \
  --tag "$IMAGE_TAG" \
  --quiet \
  . >/dev/null

docker image rm "$IMAGE_TAG" >/dev/null 2>&1 || true
echo "OK: docker build przeszedł"

echo "=== verify 046: OK ==="
