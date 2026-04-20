#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 023: single-image worker ==="

# 1. Sprawdź że pliki istnieją
for f in src/jobs/single-image-worker.ts src/jobs/__tests__/single-image-worker.test.ts; do
  [[ -f "$f" ]] || fail "brak pliku $f"
done

# 2. Sprawdź że worker jest zarejestrowany w worker-entry.ts
grep -q "single-image-worker" src/jobs/worker-entry.ts || fail "single-image-worker nie jest zarejestrowany w worker-entry.ts"

# 3. Sprawdź TypeScript
echo "--- tsc ---"
run_tsc

# 4. Uruchom testy jednostkowe
echo "--- vitest ---"
run_vitest src/jobs/__tests__/single-image-worker.test.ts

echo "=== verify 023 PASSED ==="
