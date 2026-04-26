#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 043: BullBoard — UI monitorowania kolejek ==="

echo "[1/3] tsc --noEmit"
run_tsc

echo "[2/3] Sprawdzam pliki i wzorce"
require_files \
  "src/app/(payload)/admin/queues/[[...slug]]/route.ts" \
  "src/app/(payload)/admin/components/QueuesNavLink.tsx" \
  "src/payload.config.ts"

ROUTE="src/app/(payload)/admin/queues/[[...slug]]/route.ts"

assert_file_contains "$ROUTE" \
  'getCurrentUser' \
  "route.ts: brak wywołania getCurrentUser (auth guard)"

assert_file_contains "$ROUTE" \
  "role.*admin|admin.*role" \
  "route.ts: brak sprawdzenia roli admin"

assert_file_contains "$ROUTE" \
  "createBullBoard" \
  "route.ts: brak inicjalizacji BullBoard"

assert_file_contains "$ROUTE" \
  "BullMQAdapter" \
  "route.ts: brak BullMQAdapter"

assert_file_contains "$ROUTE" \
  "researchQueue" \
  "route.ts: brak researchQueue"

assert_file_contains "$ROUTE" \
  "imagesQueue" \
  "route.ts: brak imagesQueue"

assert_file_contains "$ROUTE" \
  "singleImageQueue" \
  "route.ts: brak singleImageQueue"

assert_file_contains "$ROUTE" \
  "pdfQueue" \
  "route.ts: brak pdfQueue"

assert_file_contains "$ROUTE" \
  "ExpressAdapter" \
  "route.ts: brak ExpressAdapter"

assert_file_contains "$ROUTE" \
  "/admin/queues" \
  "route.ts: brak BASE_PATH /admin/queues"

assert_file_contains "src/payload.config.ts" \
  "QueuesNavLink" \
  "payload.config.ts: brak rejestracji QueuesNavLink w afterNavLinks"

assert_file_contains "package.json" \
  "@bull-board/api" \
  "package.json: brak zależności @bull-board/api"

assert_file_contains "package.json" \
  "@bull-board/express" \
  "package.json: brak zależności @bull-board/express"

echo "OK: pliki i wzorce"

echo "[3/3] Sprawdzam eksporty route handlera"
assert_file_contains "$ROUTE" \
  "export const GET" \
  "route.ts: brak export GET"

assert_file_contains "$ROUTE" \
  "export const POST" \
  "route.ts: brak export POST"

echo "OK: eksporty route handlera"

echo "=== verify 043: OK ==="
