#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== 018: tsc ==="
run_tsc

echo "=== 018: vitest batch ==="
run_vitest src/lib/openai/__tests__/batch.test.ts

echo "=== 018: OK ==="
