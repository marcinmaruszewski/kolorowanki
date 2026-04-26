#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 048: Dokumentacja deploy na Dokploy ==="

echo "[1/2] Sprawdzam plik"
require_files "docs/DEPLOY.md"

echo "[2/2] Sprawdzam minimalną liczbę sekcji (>= 7)"
SECTION_COUNT=$(grep -c "^## " docs/DEPLOY.md)

if (( SECTION_COUNT < 7 )); then
  echo "FAIL: docs/DEPLOY.md ma tylko ${SECTION_COUNT} sekcji ## (wymagane >= 7)" >&2
  exit 1
fi

echo "OK: ${SECTION_COUNT} sekcji"

assert_file_contains "docs/DEPLOY.md" \
  "ENV|env|environment" \
  "DEPLOY.md: brak sekcji o ENV"

assert_file_contains "docs/DEPLOY.md" \
  "promote-admin" \
  "DEPLOY.md: brak opisu promocji admina"

assert_file_contains "docs/DEPLOY.md" \
  "049" \
  "DEPLOY.md: brak odniesienia do smoke test (049)"

echo "=== verify 048: OK ==="
