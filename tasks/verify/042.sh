#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 042: admin dashboard kosztów OpenAI ==="

echo "[1/3] tsc --noEmit"
run_tsc

echo "[2/3] Sprawdzam pliki i wzorce"
require_files \
  "src/app/(payload)/admin/components/CostDashboard.tsx" \
  "src/app/(payload)/admin/importMap.ts"

assert_file_contains \
  "src/app/(payload)/admin/components/CostDashboard.tsx" \
  'CostDashboard' \
  "CostDashboard.tsx: brak eksportu CostDashboard"

assert_file_contains \
  "src/app/(payload)/admin/components/CostDashboard.tsx" \
  '\$' \
  "CostDashboard.tsx: brak znaku dolara (koszt w USD)"

assert_file_contains \
  "src/app/(payload)/admin/components/CostDashboard.tsx" \
  "role.*admin|admin.*role" \
  "CostDashboard.tsx: brak sprawdzania roli admin"

assert_file_contains \
  "src/app/(payload)/admin/components/CostDashboard.tsx" \
  "generation-jobs" \
  "CostDashboard.tsx: brak zapytania do generation-jobs"

assert_file_contains \
  "src/payload.config.ts" \
  "/koszty" \
  "payload.config.ts: brak rejestracji widoku /koszty"

assert_file_contains \
  "src/app/(payload)/admin/importMap.ts" \
  "CostDashboard" \
  "importMap.ts: brak wpisu CostDashboard"

echo "OK: pliki i wzorce"

echo "[3/3] Sprawdzam strukturę aggregacji"
assert_file_contains \
  "src/app/(payload)/admin/components/CostDashboard.tsx" \
  "byType|by_type|research" \
  "CostDashboard.tsx: brak podziału wg typu"

assert_file_contains \
  "src/app/(payload)/admin/components/CostDashboard.tsx" \
  "top5|top-5|slice" \
  "CostDashboard.tsx: brak listy top-5 kalendarzy"

echo "OK: struktura aggregacji"

echo "=== verify 042: OK ==="
