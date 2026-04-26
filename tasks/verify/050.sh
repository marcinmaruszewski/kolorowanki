#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 050: Checklist gotowości produkcyjnej ==="

echo "[1/3] Sprawdzam plik"
require_files "docs/PRODUCTION_CHECKLIST.md"

echo "[2/3] Sprawdzam minimalną liczbę pozycji checklisty (>= 10)"
ITEM_COUNT=$(grep -c "\- \[" docs/PRODUCTION_CHECKLIST.md || true)

if (( ITEM_COUNT < 10 )); then
  echo "FAIL: za mało pozycji checklisty: ${ITEM_COUNT} (wymagane >= 10)" >&2
  exit 1
fi

echo "OK: ${ITEM_COUNT} pozycji checklisty"

echo "[3/3] Sprawdzam kluczowe tematy"
assert_file_contains "docs/PRODUCTION_CHECKLIST.md" \
  "ENABLE_DEV_LOGIN" \
  "PRODUCTION_CHECKLIST.md: brak wpisu o ENABLE_DEV_LOGIN"

assert_file_contains "docs/PRODUCTION_CHECKLIST.md" \
  "PAYLOAD_SECRET" \
  "PRODUCTION_CHECKLIST.md: brak wpisu o PAYLOAD_SECRET"

assert_file_contains "docs/PRODUCTION_CHECKLIST.md" \
  "promote-admin" \
  "PRODUCTION_CHECKLIST.md: brak wpisu o promocji admina"

assert_file_contains "docs/PRODUCTION_CHECKLIST.md" \
  "smoke" \
  "PRODUCTION_CHECKLIST.md: brak wpisu o smoke test"

assert_file_contains "docs/PRODUCTION_CHECKLIST.md" \
  "backup" \
  "PRODUCTION_CHECKLIST.md: brak wpisu o backupach"

echo "OK: kluczowe tematy obecne"

echo "=== verify 050: OK ==="
