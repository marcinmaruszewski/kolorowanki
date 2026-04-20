#!/usr/bin/env bash
set -euo pipefail

echo "=== verify 022: images worker ==="

# 1. Sprawdź że pliki istnieją
for f in src/jobs/images-worker.ts src/jobs/__tests__/images-worker.test.ts; do
  if [ ! -f "$f" ]; then
    echo "FAIL: brak pliku $f"
    exit 1
  fi
done

# 2. Sprawdź że worker jest zarejestrowany w worker-entry.ts
if ! grep -q "images-worker" src/jobs/worker-entry.ts; then
  echo "FAIL: images-worker nie jest zarejestrowany w worker-entry.ts"
  exit 1
fi

# 3. Sprawdź TypeScript
echo "--- tsc ---"
docker compose run --rm app pnpm exec tsc --noEmit

# 4. Uruchom testy jednostkowe
echo "--- vitest ---"
docker compose run --rm app pnpm exec vitest run src/jobs/__tests__/images-worker.test.ts

echo "=== verify 022 PASSED ==="
