#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 005: Payload v3 + Next.js install ==="

# 1. Check required files exist
FILES=(
  "package.json"
  "pnpm-lock.yaml"
  "next.config.mjs"
  "tsconfig.json"
  "docker-compose.yml"
  "src/app/(payload)/layout.tsx"
  "src/app/(payload)/admin/[[...segments]]/page.tsx"
  "src/app/(payload)/admin/[[...segments]]/not-found.tsx"
  "src/app/(payload)/api/[...slug]/route.ts"
  "src/app/(payload)/api/graphql/route.ts"
  "src/payload.config.ts"
  "src/payload-types.ts"
)

for f in "${FILES[@]}"; do
  [[ -f "$f" ]] || fail "missing file $f"
done
echo "OK: all required files present"

# 2. TypeScript check
run_tsc
echo "OK: tsc --noEmit passed"

# 3. Check payload and next are in package.json
grep -q '"payload"' package.json || fail "payload not found in package.json"
grep -q '"next"' package.json || fail "next not found in package.json"
echo "OK: payload and next in package.json"

# 4. Check pnpm dev script
grep -q '"dev"' package.json || fail "dev script not in package.json"
echo "OK: dev script present"

# 5. Check docker-compose has pnpm dev command for app
grep -q 'pnpm.*dev\|dev.*pnpm' docker-compose.yml \
  || fail "pnpm dev command not found in docker-compose.yml for app service"
echo "OK: docker-compose.yml has pnpm dev command"

# 6. Check tsconfig has @payload-config path
grep -q '@payload-config' tsconfig.json || fail "@payload-config path not found in tsconfig.json"
echo "OK: @payload-config path alias present in tsconfig.json"

# 7. Start clean stack and run app smoke
SESSION="verify-005-$$"
trap 'close_browser_session "$SESSION"; reset_compose_state' EXIT

reset_compose_state
start_compose_services postgres redis app

echo "--- vitest smoke ---"
run_task_vitest tests/task-005

echo "--- browser smoke /login ---"
browser_wait_for_page "$SESSION" "http://127.0.0.1:3000/login"
assert_browser_main_contains "$SESSION" "Zaloguj się, żeby wygenerować kalendarz kolorowanek"

echo "=== verify 005 PASSED ==="
