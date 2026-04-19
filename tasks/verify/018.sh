#!/usr/bin/env bash
set -e

echo "=== 018: tsc ==="
docker compose run --rm app pnpm exec tsc --noEmit

echo "=== 018: vitest batch ==="
docker compose run --rm app pnpm exec vitest run src/lib/openai/__tests__/batch.test.ts

echo "=== 018: OK ==="
