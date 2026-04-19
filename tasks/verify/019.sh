#!/usr/bin/env bash
set -e

echo "=== 019: tsc ==="
docker compose run --rm app pnpm exec tsc --noEmit

echo "=== 019: vitest integration (Redis ping) ==="
docker compose run --rm app pnpm exec vitest run src/lib/queue/__tests__/connection.test.ts

echo "=== 019: OK ==="
