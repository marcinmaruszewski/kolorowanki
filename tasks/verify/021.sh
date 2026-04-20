#!/usr/bin/env bash
set -euo pipefail

echo "=== verify 021: research worker ==="

# 1. Sprawdź że pliki istnieją
for f in src/jobs/research-worker.ts src/jobs/__tests__/research-worker.test.ts; do
  if [ ! -f "$f" ]; then
    echo "FAIL: brak pliku $f"
    exit 1
  fi
done

# 2. Sprawdź że worker jest zarejestrowany w worker-entry.ts
if ! grep -q "research-worker" src/jobs/worker-entry.ts; then
  echo "FAIL: research-worker nie jest zarejestrowany w worker-entry.ts"
  exit 1
fi

# 3. Sprawdź TypeScript
echo "--- tsc ---"
docker compose run --rm app pnpm exec tsc --noEmit

# 4. Uruchom testy jednostkowe
echo "--- vitest ---"
docker compose run --rm app pnpm exec vitest run src/jobs/__tests__/research-worker.test.ts

echo "=== verify 021 PASSED ==="
