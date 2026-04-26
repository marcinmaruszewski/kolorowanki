#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 044: Promowanie usera do roli admin ==="

echo "[1/3] Sprawdzam pliki"
require_files \
  "scripts/promote-admin.ts" \
  "docs/AGENTS.md"

echo "[2/3] Sprawdzam wzorce w skrypcie"
SCRIPT="scripts/promote-admin.ts"

assert_file_contains "$SCRIPT" \
  "\-\-email=" \
  "promote-admin.ts: brak parsowania --email="

assert_file_contains "$SCRIPT" \
  "payload\.update" \
  "promote-admin.ts: brak wywołania payload.update"

assert_file_contains "$SCRIPT" \
  "collection:.*users|'users'" \
  "promote-admin.ts: brak kolekcji users"

assert_file_contains "$SCRIPT" \
  "role.*admin|admin.*role" \
  "promote-admin.ts: brak ustawiania roli admin"

assert_file_contains "$SCRIPT" \
  "payload\.init" \
  "promote-admin.ts: brak wywołania payload.init"

assert_file_contains "$SCRIPT" \
  "process\.exit" \
  "promote-admin.ts: brak obsługi błędów (process.exit)"

echo "OK: wzorce w skrypcie"

echo "[2b/3] Sprawdzam docs/AGENTS.md — sekcja Promowanie admin"
assert_file_contains "docs/AGENTS.md" \
  "Promowanie admin" \
  "AGENTS.md: brak sekcji 'Promowanie admin'"

assert_file_contains "docs/AGENTS.md" \
  "promote-admin\.ts" \
  "AGENTS.md: brak komendy promote-admin.ts"

assert_file_contains "docs/AGENTS.md" \
  "docker compose exec app tsx" \
  "AGENTS.md: brak przykładu docker compose exec"

echo "OK: docs/AGENTS.md"

echo "[3/3] Vitest — parsowanie argumentów"
run_vitest "tests/task-044/promote-admin-args.test.ts"

echo "=== verify 044: OK ==="
