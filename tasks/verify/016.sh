#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== 016: prompt builder i schema researchu miesiąca ==="

# Pliki istnieją
SCHEMA=src/lib/openai/schemas/month-plan.ts
RESEARCH=src/lib/openai/research.ts
[ -f "$SCHEMA" ]   || { echo "FAIL: brak $SCHEMA"; exit 1; }
[ -f "$RESEARCH" ] || { echo "FAIL: brak $RESEARCH"; exit 1; }

# Eksporty w schema
grep -q 'export const MonthPlanSchema' "$SCHEMA" || { echo "FAIL: brak MonthPlanSchema"; exit 1; }
grep -q 'export type MonthPlan'        "$SCHEMA" || { echo "FAIL: brak MonthPlan"; exit 1; }

# Eksporty w research
grep -q 'export function buildResearchPrompt' "$RESEARCH" || { echo "FAIL: brak buildResearchPrompt"; exit 1; }
grep -q 'export function parseMonthPlan'      "$RESEARCH" || { echo "FAIL: brak parseMonthPlan"; exit 1; }

# zod w package.json
grep -q '"zod"' package.json || { echo "FAIL: brak zod w package.json"; exit 1; }

# vitest — tylko testy research (16 testów jednostkowych, bez testów HTTP)
run_vitest src/lib/openai/__tests__/research.test.ts

echo "OK"
