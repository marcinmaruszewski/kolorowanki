#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 037: zapis stanu edytora do DB ==="

echo "[1/4] Sprawdzam pliki i wzorce"
require_files \
  "src/payload/collections/calendars.ts" \
  "src/app/(app)/kalendarz/[id]/edytor/actions.ts" \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "src/app/(app)/kalendarz/[id]/edytor/toolbar.tsx" \
  "src/app/(app)/kalendarz/[id]/edytor/page.tsx"

# pole layoutJson w kolekcji
assert_file_contains \
  "src/payload/collections/calendars.ts" \
  "layoutJson" \
  "calendars.ts: brak pola layoutJson"

assert_file_contains \
  "src/payload/collections/calendars.ts" \
  "type.*json" \
  "calendars.ts: layoutJson powinien mieć type: 'json'"

# Server Action: saveLayout
assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/actions.ts" \
  "use server" \
  "actions.ts: brak 'use server'"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/actions.ts" \
  "saveLayout" \
  "actions.ts: brak funkcji saveLayout"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/actions.ts" \
  "generated.*composed|composed.*generated" \
  "actions.ts: brak guard na status generated/composed"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/actions.ts" \
  "status.*composed" \
  "actions.ts: brak ustawiania status: 'composed'"

# FabricCanvas: initialLayout + loadFromJSON + saveLayout
assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "initialLayout" \
  "fabric-canvas.tsx: brak props initialLayout"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "loadFromJSON.*initialLayout|initialLayout.*loadFromJSON" \
  "fabric-canvas.tsx: brak ładowania z initialLayout"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "saveLayout" \
  "fabric-canvas.tsx: brak importu/wywołania saveLayout"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx" \
  "handleSave|onSave" \
  "fabric-canvas.tsx: brak handleSave"

# Toolbar: przycisk Zapisz
assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/toolbar.tsx" \
  "Zapisz" \
  "toolbar.tsx: brak przycisku Zapisz"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/toolbar.tsx" \
  "onSave" \
  "toolbar.tsx: brak props onSave"

# page.tsx: dopuszcza status composed + przekazuje initialLayout
assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/page.tsx" \
  "composed" \
  "page.tsx: brak obsługi statusu composed"

assert_file_contains \
  "src/app/(app)/kalendarz/[id]/edytor/page.tsx" \
  "initialLayout" \
  "page.tsx: brak przekazania initialLayout do FabricCanvas"

echo "OK: pliki i wzorce"

echo "[2/4] generate:types — layoutJson w Calendar"
run_generate_types
assert_file_contains \
  "src/payload-types.ts" \
  "layoutJson" \
  "payload-types.ts: brak layoutJson po generate:types"

echo "OK: typy"

echo "[3/4] tsc --noEmit"
run_tsc

echo "[4/4] Czysty stack + vitest (zapis/odczyt layoutJson)"
reset_compose_state
start_compose_services postgres redis app
run_task_vitest tests/task-037

echo "OK: vitest"

echo "=== verify 037: OK ==="
