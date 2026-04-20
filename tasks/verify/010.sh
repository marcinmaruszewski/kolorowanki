#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify task-010: quota enforcement + cron reset ==="

echo "--- tsc noEmit ---"
run_tsc

echo "--- unit tests ---"
run_vitest tests/task-010

echo "--- sprawdzam eksporty (grep) ---"
grep -q "export.*enforceCalendarQuota" src/payload/hooks/enforce-calendar-quota.ts
grep -q "export.*resetMonthlyQuotasIfFirstOfMonth" src/jobs/quota-reset-cron.ts
echo "eksporty OK"

echo "=== task-010 OK ==="
