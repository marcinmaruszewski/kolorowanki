#!/usr/bin/env bash
set -euo pipefail

echo "=== verify 020: worker container ==="

# 1. Check worker-entry.ts exists
if [ ! -f "src/jobs/worker-entry.ts" ]; then
  echo "FAIL: src/jobs/worker-entry.ts not found"
  exit 1
fi

# 2. Check package.json has worker script
if ! grep -q '"worker"' package.json; then
  echo "FAIL: package.json missing 'worker' script"
  exit 1
fi

# 3. Check docker-compose.yml has worker service
if ! grep -q 'worker:' docker-compose.yml; then
  echo "FAIL: docker-compose.yml missing 'worker' service"
  exit 1
fi

# 4. Start worker container and check logs
docker compose up -d worker 2>/dev/null

# Wait up to 15s for the startup message
FOUND=0
for i in $(seq 1 15); do
  if docker compose logs worker 2>/dev/null | grep -q "Worker entrypoint started"; then
    FOUND=1
    break
  fi
  sleep 1
done

if [ "$FOUND" -eq 0 ]; then
  echo "FAIL: worker did not log 'Worker entrypoint started' within 15s"
  docker compose logs worker
  docker compose stop worker
  exit 1
fi

echo "OK: worker started and logged expected message"

# 5. Check SIGTERM graceful shutdown
WORKER_CID=$(docker compose ps -q worker)
docker kill --signal=SIGTERM "$WORKER_CID" >/dev/null 2>&1

# Wait up to 10s for container to exit
EXIT_CODE=1
for i in $(seq 1 10); do
  STATUS=$(docker inspect --format='{{.State.Status}}' "$WORKER_CID" 2>/dev/null || echo "gone")
  if [ "$STATUS" = "exited" ] || [ "$STATUS" = "gone" ]; then
    EXIT_CODE=0
    break
  fi
  sleep 1
done

docker compose stop worker 2>/dev/null || true

if [ "$EXIT_CODE" -ne 0 ]; then
  echo "FAIL: worker did not exit within 10s after SIGTERM"
  exit 1
fi

echo "OK: worker shut down cleanly after SIGTERM"
echo "=== verify 020 PASSED ==="
