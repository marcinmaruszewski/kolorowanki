#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== 019: tsc ==="
run_tsc

echo "=== 019: vitest integration (Redis ping) ==="
run_vitest src/lib/queue/__tests__/connection.test.ts

echo "=== 019: OK ==="
