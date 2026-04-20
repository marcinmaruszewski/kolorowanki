#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

require_files() {
  local file
  for file in "$@"; do
    [[ -f "$file" ]] || fail "brakujący plik: $file"
  done
}

assert_file_contains() {
  local file="$1"
  local pattern="$2"
  local message="$3"

  grep -qE "$pattern" "$file" || fail "$message"
}

run_tsc() {
  echo "--- tsc --noEmit ---"
  docker compose run --rm app pnpm exec tsc --noEmit
}

run_vitest() {
  docker compose run --rm app pnpm vitest run "$@"
}

run_generate_types() {
  docker compose run --rm app pnpm generate:types
}

reset_compose_state() {
  echo "--- reset docker compose volumes ---"
  docker compose down -v --remove-orphans >/dev/null 2>&1 || true
}

start_compose_services() {
  echo "--- start docker compose: $* ---"
  docker compose up -d "$@"
}

run_task_vitest() {
  local path="$1"
  shift || true
  docker compose exec -T "$@" app pnpm vitest run "$path"
}

exec_in_service() {
  local service="$1"
  shift
  docker compose exec -T "$service" "$@"
}

compose_service_field() {
  local service="$1"
  local field="$2"
  local raw

  raw="$(docker compose ps --format json "$service" 2>/dev/null || true)"
  RAW="$raw" python3 - "$field" <<'PY'
import json
import os
import sys

field = sys.argv[1]
raw = os.environ.get("RAW", "").strip()
if not raw:
    print("")
    raise SystemExit(0)

rows = []
for line in raw.splitlines():
    line = line.strip()
    if not line:
        continue
    parsed = json.loads(line)
    if isinstance(parsed, list):
        rows.extend(parsed)
    else:
        rows.append(parsed)

if not rows:
    print("")
    raise SystemExit(0)

value = rows[0].get(field, "")
print("" if value is None else value)
PY
}

wait_for_service_field() {
  local service="$1"
  local field="$2"
  local expected="$3"
  local attempts="${4:-30}"
  local delay_seconds="${5:-2}"
  local value=""
  local try

  for ((try = 1; try <= attempts; try++)); do
    value="$(compose_service_field "$service" "$field")"
    if [[ "$value" == "$expected" ]]; then
      return 0
    fi
    sleep "$delay_seconds"
  done

  docker compose ps "$service" || true
  docker compose logs "$service" --tail=60 || true
  fail "service '$service' field '$field' expected '$expected', got '$value'"
}

wait_for_service_health() {
  local service="$1"
  local attempts="${2:-30}"
  local delay_seconds="${3:-2}"
  wait_for_service_field "$service" "Health" "healthy" "$attempts" "$delay_seconds"
}

wait_for_service_state() {
  local service="$1"
  local expected="${2:-running}"
  local attempts="${3:-30}"
  local delay_seconds="${4:-2}"
  wait_for_service_field "$service" "State" "$expected" "$attempts" "$delay_seconds"
}

wait_for_service_log() {
  local service="$1"
  local pattern="$2"
  local attempts="${3:-30}"
  local delay_seconds="${4:-2}"
  local try

  for ((try = 1; try <= attempts; try++)); do
    if docker compose logs "$service" 2>/dev/null | grep -qE "$pattern"; then
      return 0
    fi
    sleep "$delay_seconds"
  done

  docker compose logs "$service" --tail=80 || true
  fail "service '$service' did not log pattern '$pattern'"
}

browser_wait_for_page() {
  local session="$1"
  local url="$2"
  local attempts="${3:-30}"
  local delay_seconds="${4:-2}"
  local try

  for ((try = 1; try <= attempts; try++)); do
    if agent-browser --session "$session" open "$url" >/dev/null 2>&1; then
      agent-browser --session "$session" wait --load networkidle >/dev/null 2>&1 || true
      return 0
    fi
    sleep "$delay_seconds"
  done

  docker compose logs app --tail=40 || true
  fail "aplikacja nie odpowiedziała dla $url"
}

browser_main_text() {
  local session="$1"
  agent-browser --session "$session" get text "main"
}

assert_browser_main_contains() {
  local session="$1"
  local needle="$2"
  local text

  text="$(browser_main_text "$session")"
  grep -qF "$needle" <<<"$text" || fail "brak tekstu '$needle' w głównym obszarze strony"
}

close_browser_session() {
  local session="${1:-}"
  [[ -n "$session" ]] || return 0
  agent-browser --session "$session" close >/dev/null 2>&1 || true
}
