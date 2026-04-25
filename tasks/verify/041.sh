#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_helpers.sh"

echo "=== task-041: Worker kolejki PDF ==="

require_files \
  "src/jobs/pdf-worker.ts" \
  "src/jobs/worker-entry.ts"

echo "--- sprawdzam strukturę kodu ---"

assert_file_contains \
  "src/jobs/pdf-worker.ts" \
  "renderCalendarPdf" \
  "brak wywołania renderCalendarPdf w pdf-worker.ts"

assert_file_contains \
  "src/jobs/pdf-worker.ts" \
  "application/pdf" \
  "brak mimetype application/pdf w pdf-worker.ts"

assert_file_contains \
  "src/jobs/pdf-worker.ts" \
  "status: 'exported'" \
  "brak ustawiania status='exported' na kalendarzu"

assert_file_contains \
  "src/jobs/pdf-worker.ts" \
  "status: 'failed'" \
  "brak obsługi błędu (status='failed') w pdf-worker.ts"

assert_file_contains \
  "src/jobs/worker-entry.ts" \
  "pdfWorker" \
  "pdfWorker nie jest zarejestrowany w worker-entry.ts"

echo "--- uruchamiam testy jednostkowe ---"
docker compose run --rm app pnpm vitest run src/jobs/__tests__/pdf-worker.test.ts

echo "=== task-041 OK ==="
