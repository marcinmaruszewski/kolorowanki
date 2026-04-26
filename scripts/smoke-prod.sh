#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${PROD_URL:-}}"

if [[ -z "$BASE_URL" ]]; then
  echo "Użycie: $0 <base-url>"
  echo "  np.: $0 https://kolorowanki.marcinmaruszewski.me"
  exit 1
fi

BASE_URL="${BASE_URL%/}"

GREEN="\033[0;32m"
RED="\033[0;31m"
RESET="\033[0m"

PASS=0
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local expected="$3"

  local status
  status=$(curl -sSL -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo "000")

  if [[ "$status" == "$expected" ]]; then
    echo -e "${GREEN}✓${RESET} ${label} → ${status}"
    (( PASS++ )) || true
  else
    echo -e "${RED}✗${RESET} ${label} → ${status} (oczekiwano ${expected})"
    (( FAIL++ )) || true
  fi
}

echo "Smoke test: ${BASE_URL}"
echo "---"

check "GET / (redirect na /login)"        "${BASE_URL}/"        "200"
check "GET /login"                         "${BASE_URL}/login"    "200"
check "GET /kalendarze (redirect 302)"     "${BASE_URL}/kalendarze" "302"
check "GET /admin (Payload admin UI)"      "${BASE_URL}/admin"   "200"
check "GET /admin/queues (BullBoard)"      "${BASE_URL}/admin/queues" "200"

echo "---"
echo "Wynik: ${PASS} ✓, ${FAIL} ✗"

if (( FAIL > 0 )); then
  echo -e "${RED}FAIL: ${FAIL} check(s) nie przeszło${RESET}"
  exit 1
fi

echo -e "${GREEN}OK: wszystkie checks przeszły${RESET}"
