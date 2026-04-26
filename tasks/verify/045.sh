#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 045: Production Dockerfile ==="

echo "[1/4] Sprawdzam pliki"
require_files \
  "Dockerfile.prod" \
  ".dockerignore" \
  "next.config.mjs"

echo "[2/4] Sprawdzam wzorce Dockerfile.prod"
DF="Dockerfile.prod"

assert_file_contains "$DF" \
  "FROM node:22-alpine AS deps" \
  "Dockerfile.prod: brak stage deps"

assert_file_contains "$DF" \
  "FROM node:22-alpine AS builder" \
  "Dockerfile.prod: brak stage builder"

assert_file_contains "$DF" \
  "FROM node:22-alpine AS runner" \
  "Dockerfile.prod: brak stage runner"

assert_file_contains "$DF" \
  "pnpm install --frozen-lockfile" \
  "Dockerfile.prod: brak pnpm install --frozen-lockfile"

assert_file_contains "$DF" \
  "pnpm next build" \
  "Dockerfile.prod: brak pnpm next build"

assert_file_contains "$DF" \
  "\.next/standalone" \
  "Dockerfile.prod: brak kopiowania .next/standalone"

assert_file_contains "$DF" \
  'CMD \["node", "server\.js"\]' \
  "Dockerfile.prod: brak CMD node server.js"

assert_file_contains "$DF" \
  "EXPOSE 3000" \
  "Dockerfile.prod: brak EXPOSE 3000"

echo "OK: wzorce Dockerfile.prod"

echo "[3/4] Sprawdzam wzorce .dockerignore i next.config.mjs"
assert_file_contains ".dockerignore" \
  "^media$" \
  ".dockerignore: brak wpisu media"

assert_file_contains ".dockerignore" \
  "^node_modules$" \
  ".dockerignore: brak wpisu node_modules"

assert_file_contains "next.config.mjs" \
  "standalone" \
  "next.config.mjs: brak output: 'standalone'"

echo "OK: .dockerignore i next.config.mjs"

echo "[4/4] Docker build + sprawdzenie rozmiaru obrazu"
IMAGE_TAG="kolorowanki:verify-045"

docker build \
  --file Dockerfile.prod \
  --tag "$IMAGE_TAG" \
  --build-arg DATABASE_URI="postgresql://x:x@localhost:5432/x" \
  --build-arg PAYLOAD_SECRET="verify-placeholder-secret" \
  --quiet \
  . >/dev/null

SIZE_BYTES=$(docker image inspect "$IMAGE_TAG" --format '{{.Size}}')
SIZE_MB=$(( SIZE_BYTES / 1024 / 1024 ))

echo "Rozmiar obrazu: ${SIZE_MB} MB"

if (( SIZE_MB >= 400 )); then
  docker image rm "$IMAGE_TAG" >/dev/null 2>&1 || true
  echo "FAIL: obraz waży ${SIZE_MB} MB (limit: 400 MB)" >&2
  exit 1
fi

docker image rm "$IMAGE_TAG" >/dev/null 2>&1 || true
echo "OK: obraz ${SIZE_MB} MB < 400 MB"

echo "=== verify 045: OK ==="
