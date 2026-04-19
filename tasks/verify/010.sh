#!/usr/bin/env bash
set -euo pipefail

echo "=== verify task-010: quota enforcement + cron reset ==="

echo "--- tsc noEmit ---"
docker compose run --rm app pnpm exec tsc --noEmit

echo "--- unit tests ---"
docker compose run --rm app pnpm vitest run tests/task-010

echo "--- sprawdzam eksporty (grep) ---"
grep -q "export.*enforceCalendarQuota" src/payload/hooks/enforce-calendar-quota.ts
grep -q "export.*resetMonthlyQuotasIfFirstOfMonth" src/jobs/quota-reset-cron.ts
echo "eksporty OK"

echo "=== task-010 OK ==="
