#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 030: akceptacja planu + trigger batch generacji ==="

echo "[1/4] tsc --noEmit"
run_tsc

echo "[2/4] Sprawdzam pliki"
require_files \
  "src/jobs/enqueue-images.ts" \
  "src/app/(app)/kalendarz/[id]/plan/actions.ts" \
  "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx"

assert_file_contains "src/jobs/enqueue-images.ts" 'enqueueImagesBatch' "enqueue-images.ts: brak enqueueImagesBatch"
assert_file_contains "src/jobs/enqueue-images.ts" 'submitBatch' "enqueue-images.ts: brak submitBatch"
assert_file_contains "src/jobs/enqueue-images.ts" "type: 'images'" "enqueue-images.ts: brak type images"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/actions.ts" 'acceptPlan' "actions.ts: brak acceptPlan"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/actions.ts" 'plan_accepted' "actions.ts: brak status plan_accepted"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" 'acceptPlan' "plan-table.tsx: brak przycisku acceptPlan"
assert_file_contains "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" 'Wygeneruj obrazki' "plan-table.tsx: brak tekstu 'Wygeneruj obrazki'"

trap 'reset_compose_state' EXIT

echo "[3/4] Czysty stack + vitest"
reset_compose_state
start_compose_services postgres redis app
run_task_vitest tests/task-030

echo "[4/4] OK"
echo "=== verify 030: OK ==="
