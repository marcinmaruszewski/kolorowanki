#!/usr/bin/env bash
set -euo pipefail

echo "=== verify task-011: kolekcja calendars ==="

echo "--- tsc noEmit ---"
docker compose run --rm app pnpm exec tsc --noEmit

echo "--- generate:types (sprawdź stabilność) ---"
docker compose run --rm app pnpm generate:types

echo "--- grep: interface Calendar w payload-types ---"
grep -q "interface Calendar" src/payload-types.ts
echo "interface Calendar OK"

echo "--- grep: Calendars zarejestrowane w payload.config ---"
grep -q "Calendars" src/payload.config.ts
echo "Calendars w config OK"

echo "--- unit tests ---"
docker compose run --rm app pnpm vitest run tests/task-011

echo "=== task-011 OK ==="
