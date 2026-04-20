#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify task-011: kolekcja calendars ==="

echo "--- tsc noEmit ---"
run_tsc

echo "--- generate:types (sprawdź stabilność) ---"
run_generate_types

echo "--- grep: interface Calendar w payload-types ---"
grep -q "interface Calendar" src/payload-types.ts
echo "interface Calendar OK"

echo "--- grep: Calendars zarejestrowane w payload.config ---"
grep -q "Calendars" src/payload.config.ts
echo "Calendars w config OK"

echo "--- unit tests ---"
run_vitest tests/task-011

echo "=== task-011 OK ==="
