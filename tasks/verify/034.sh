#!/usr/bin/env bash
set -euo pipefail
docker compose run --rm app pnpm vitest run build-slots
