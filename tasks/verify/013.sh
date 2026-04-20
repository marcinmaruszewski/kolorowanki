#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== task-013: generationJobs collection ==="

# tsc
echo ">> tsc --noEmit"
run_tsc

# typy zawierają GenerationJob
echo ">> grep GenerationJob w payload-types.ts"
grep -q "interface GenerationJob" src/payload-types.ts

# kolekcja zarejestrowana w konfigu
echo ">> grep GenerationJobs w payload.config.ts"
grep -q "GenerationJobs" src/payload.config.ts

# plik kolekcji istnieje i ma wymagane pola
echo ">> grep pól w generation-jobs.ts"
grep -q "generation-jobs" src/payload/collections/generation-jobs.ts
grep -q "openaiBatchId" src/payload/collections/generation-jobs.ts
grep -q "costUsd" src/payload/collections/generation-jobs.ts
grep -q "inputTokens" src/payload/collections/generation-jobs.ts
grep -q "outputTokens" src/payload/collections/generation-jobs.ts
grep -q "errorLog" src/payload/collections/generation-jobs.ts
grep -q "startedAt" src/payload/collections/generation-jobs.ts
grep -q "completedAt" src/payload/collections/generation-jobs.ts

echo "=== OK ==="
