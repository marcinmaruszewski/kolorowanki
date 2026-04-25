#!/usr/bin/env bash

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_helpers.sh"

echo "=== task-038: Trigger eksportu PDF z edytora ==="

require_files \
  src/app/\(app\)/kalendarz/\[id\]/edytor/actions.ts \
  src/app/\(app\)/kalendarz/\[id\]/edytor/toolbar.tsx \
  src/app/\(app\)/kalendarz/\[id\]/edytor/fabric-canvas.tsx \
  tests/task-038/export-pdf.test.ts

echo "--- sprawdzam strukturę kodu ---"
assert_file_contains \
  src/app/\(app\)/kalendarz/\[id\]/edytor/actions.ts \
  "exportPdf" \
  "brak funkcji exportPdf w actions.ts"

assert_file_contains \
  src/app/\(app\)/kalendarz/\[id\]/edytor/actions.ts \
  "enqueuePdf" \
  "brak wywołania enqueuePdf w actions.ts"

assert_file_contains \
  src/app/\(app\)/kalendarz/\[id\]/edytor/actions.ts \
  "generation-jobs" \
  "brak tworzenia generationJob w actions.ts"

assert_file_contains \
  src/app/\(app\)/kalendarz/\[id\]/edytor/toolbar.tsx \
  "Pobierz PDF" \
  "brak przycisku 'Pobierz PDF' w toolbar.tsx"

assert_file_contains \
  src/app/\(app\)/kalendarz/\[id\]/edytor/fabric-canvas.tsx \
  "handleExportPdf" \
  "brak handlera handleExportPdf w fabric-canvas.tsx"

assert_file_contains \
  src/app/\(app\)/kalendarz/\[id\]/edytor/fabric-canvas.tsx \
  "pobierz" \
  "brak redirect na stronę pobierz w fabric-canvas.tsx"

echo "--- tsc --noEmit ---"
run_tsc

echo "--- vitest: exportPdf action ---"
run_vitest tests/task-038/export-pdf.test.ts

echo "=== task-038 OK ==="
