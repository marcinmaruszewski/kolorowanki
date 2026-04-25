#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

docker compose run --rm app pnpm exec tsc --noEmit
docker compose run --rm app pnpm vitest run src/lib/pdf/render-calendar.test.ts
