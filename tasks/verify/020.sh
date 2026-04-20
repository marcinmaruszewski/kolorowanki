#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 020: worker container ==="

# 1. Check worker-entry.ts exists
require_files "src/jobs/worker-entry.ts"

# 2. Check package.json has worker script
grep -q '"worker"' package.json || fail "package.json missing 'worker' script"

# 3. Check docker-compose.yml has worker service
grep -q 'worker:' docker-compose.yml || fail "docker-compose.yml missing 'worker' service"

# 4. Start worker container and check logs
trap 'reset_compose_state' EXIT
reset_compose_state
start_compose_services postgres redis worker
wait_for_service_log worker "Worker entrypoint started" 15 1

echo "OK: worker started and logged expected message"

# 5. Check SIGTERM graceful shutdown
docker compose stop -t 10 worker >/dev/null
wait_for_service_log worker "SIGTERM received, shutting down workers" 10 1
wait_for_service_log worker "Workers closed, exiting" 10 1

echo "OK: worker shut down cleanly after SIGTERM"
echo "=== verify 020 PASSED ==="
