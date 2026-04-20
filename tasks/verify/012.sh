#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify task-012: kolekcja days ==="

echo "--- tsc noEmit ---"
run_tsc

echo "--- generate:types (sprawdź stabilność) ---"
run_generate_types

echo "--- grep: interface Day w payload-types ---"
grep -q "interface Day" src/payload-types.ts
echo "interface Day OK"

echo "--- grep: Days zarejestrowane w payload.config ---"
grep -q "Days" src/payload.config.ts
echo "Days w config OK"

echo "--- unit tests ---"
run_vitest tests/task-012

echo "=== task-012 OK ==="
