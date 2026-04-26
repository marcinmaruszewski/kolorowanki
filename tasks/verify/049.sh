#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 049: Skrypt smoke test produkcji ==="

echo "[1/3] Sprawdzam plik i uprawnienia"
require_files "scripts/smoke-prod.sh"
[[ -x "scripts/smoke-prod.sh" ]] || { echo "FAIL: scripts/smoke-prod.sh nie jest wykonywalny" >&2; exit 1; }

echo "[2/3] Sprawdzam wzorce"
S="scripts/smoke-prod.sh"

assert_file_contains "$S" \
  "BASE_URL" \
  "smoke-prod.sh: brak obsługi BASE_URL"

assert_file_contains "$S" \
  "curl" \
  "smoke-prod.sh: brak wywołania curl"

assert_file_contains "$S" \
  "http_code" \
  "smoke-prod.sh: brak izolacji kodu HTTP"

assert_file_contains "$S" \
  "exit 1" \
  "smoke-prod.sh: brak exit 1 przy błędzie"

assert_file_contains "$S" \
  "/login" \
  "smoke-prod.sh: brak checkowania /login"

echo "OK: wzorce"

echo "[3/3] Test ze stub HTTP serverem"
# Start a minimal HTTP server returning 200 for all paths
python3 -m http.server 18765 --directory /tmp >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

# Give server a moment to start
until curl -s http://127.0.0.1:18765 >/dev/null 2>&1; do sleep 0.2; done

# Run smoke script — it will get 200 for all checks (stub returns 200)
# The /kalendarze check expects 302 but stub returns 200 — that will mark it as fail.
# We only check that the script runs without crashing and outputs structured info.
output=$(bash scripts/smoke-prod.sh "http://127.0.0.1:18765" 2>&1 || true)

echo "$output" | grep -qE "✓|✗" || { echo "FAIL: brak symboli ✓/✗ w output" >&2; exit 1; }
echo "$output" | grep -q "Wynik:" || { echo "FAIL: brak linii Wynik: w output" >&2; exit 1; }

echo "OK: skrypt uruchamia się i wypisuje strukturowany output"

echo "=== verify 049: OK ==="
