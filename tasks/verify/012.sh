#!/usr/bin/env bash
set -euo pipefail

echo "=== verify task-012: kolekcja days ==="

echo "--- tsc noEmit ---"
docker compose run --rm app pnpm exec tsc --noEmit

echo "--- generate:types (sprawdź stabilność) ---"
docker compose run --rm app pnpm generate:types

echo "--- grep: interface Day w payload-types ---"
grep -q "interface Day" src/payload-types.ts
echo "interface Day OK"

echo "--- grep: Days zarejestrowane w payload.config ---"
grep -q "Days" src/payload.config.ts
echo "Days w config OK"

echo "--- unit tests ---"
docker compose run --rm app pnpm vitest run tests/task-012

echo "=== task-012 OK ==="
