#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_helpers.sh"

echo "=== task-040: Strona pobrania PDF + API route ==="

require_files \
  "src/app/(app)/kalendarz/[id]/pobierz/page.tsx" \
  "src/app/api/kalendarz/[id]/pdf/route.ts" \
  "src/app/api/generation-jobs/[id]/route.ts"

echo "--- sprawdzam strukturę kodu ---"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/pobierz/page.tsx" \
  "Pobierz PDF" \
  "brak przycisku/linku 'Pobierz PDF' w page.tsx"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/pobierz/page.tsx" \
  "/api/kalendarz/\\\${calendarId}/pdf" \
  "brak linku do API PDF w page.tsx"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/pobierz/page.tsx" \
  "download" \
  "brak atrybutu download na linku PDF"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/pobierz/page.tsx" \
  "3000" \
  "brak interwału 3s w pollingu"

assert_file_contains \
  "src/app/api/kalendarz/[id]/pdf/route.ts" \
  "application/pdf" \
  "brak Content-Type application/pdf w route.ts"

assert_file_contains \
  "src/app/api/kalendarz/[id]/pdf/route.ts" \
  "403" \
  "brak sprawdzenia autoryzacji (403) w route.ts"

assert_file_contains \
  "src/app/api/kalendarz/[id]/pdf/route.ts" \
  "renderCalendarPdf" \
  "brak wywołania renderCalendarPdf (fallback) w route.ts"

assert_file_contains \
  "src/payload/collections/calendars.ts" \
  "pdfFile" \
  "brak pola pdfFile w kolekcji calendars"

assert_file_contains \
  "src/payload-types.ts" \
  "pdfFile" \
  "brak pola pdfFile w payload-types.ts (uruchom generate:types)"

echo "--- tsc --noEmit ---"
run_tsc

echo "=== task-040 OK ==="
