#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== verify 028: strona planu kalendarza ==="

# TypeScript check
echo "[1/4] tsc --noEmit"
docker compose run --rm app pnpm exec tsc --noEmit

# Check files exist
echo "[2/4] Sprawdzam pliki"
for f in \
  "src/app/(app)/kalendarz/[id]/plan/page.tsx" \
  "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx"
do
  [ -f "$f" ] || { echo "FAIL: brakujący plik: $f"; exit 1; }
done

grep -q 'draft' "src/app/(app)/kalendarz/[id]/plan/page.tsx" \
  || { echo "FAIL: page.tsx: brak obsługi statusu draft"; exit 1; }

grep -q 'http-equiv\|httpEquiv' "src/app/(app)/kalendarz/[id]/plan/page.tsx" \
  || { echo "FAIL: page.tsx: brak meta refresh"; exit 1; }

grep -q 'Generujemy plan' "src/app/(app)/kalendarz/[id]/plan/page.tsx" \
  || { echo "FAIL: page.tsx: brak komunikatu Generujemy plan"; exit 1; }

grep -q 'disabled' "src/app/(app)/kalendarz/[id]/plan/page.tsx" \
  || { echo "FAIL: page.tsx: przycisk Dalej powinien być disabled"; exit 1; }

grep -q 'Dzień\|Dzie' "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" \
  || { echo "FAIL: plan-table.tsx: brak kolumny Dzień"; exit 1; }

grep -q 'Okazja' "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" \
  || { echo "FAIL: plan-table.tsx: brak kolumny Okazja"; exit 1; }

grep -q 'Motyw' "src/app/(app)/kalendarz/[id]/plan/plan-table.tsx" \
  || { echo "FAIL: plan-table.tsx: brak kolumny Motyw"; exit 1; }

echo "OK: wszystkie pliki i wzorce"

# Start stack
echo "[3/4] Uruchamiam stack"
docker compose up -d

echo "--- czekam na gotowość app (max 90s) ---"
TRIES=0; MAX=18
until STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login 2>/dev/null) && [ "$STATUS" = "200" ]; do
  sleep 5; TRIES=$((TRIES+1))
  [ $TRIES -lt $MAX ] || { echo "Timeout: app nie odpowiada"; docker compose logs app --tail=20; docker compose down; exit 1; }
done
echo "OK: app odpowiada"

COOKIE_JAR=$(mktemp)
SEED_TS="$ROOT/tasks/verify/.tmp-seed-028.ts"
trap 'rm -f "$COOKIE_JAR" "$SEED_TS"; docker compose down' EXIT

echo "[4/4] E2E: strona planu z tabelą i placeholder"
if docker compose exec -T app sh -c 'echo $ENABLE_DEV_LOGIN' 2>/dev/null | grep -q 'true'; then
  # Login via dev-login
  LOGIN_RESP=$(curl -s -c "$COOKIE_JAR" -X POST http://localhost:3000/api/auth/dev-login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test-028@example.com"}')
  echo "$LOGIN_RESP" | grep -q 'email' \
    || { echo "FAIL: dev-login nie zwrócił usera: $LOGIN_RESP"; exit 1; }
  USER_ID=$(echo "$LOGIN_RESP" | grep -o '"userId":[0-9]*' | grep -o '[0-9]*')
  [ -n "$USER_ID" ] || { echo "FAIL: nie udało się odczytać userId: $LOGIN_RESP"; exit 1; }
  echo "Zalogowano userId=$USER_ID"

  # Seed: create a draft calendar (no days) via payload.db.create (bypasses beforeChange hooks)
  cat > "$SEED_TS" <<TSEOF
import { getPayload } from 'payload'
import config from '@payload-config'
const payload = await getPayload({ config })
const now = new Date().toISOString()
// Clean up any previous test calendars for this user/month to avoid unique constraint
const existing = await payload.find({
  collection: 'calendars',
  where: { and: [{ owner: { equals: ${USER_ID} } }, { year: { equals: 2026 } }, { month: { equals: 8 } }] },
  limit: 10,
  overrideAccess: true,
})
for (const c of existing.docs) {
  // Delete days first (FK constraint)
  const calDays = await payload.find({ collection: 'days', where: { calendar: { equals: c.id } }, limit: 100, overrideAccess: true })
  for (const d of calDays.docs) {
    await payload.delete({ collection: 'days', id: d.id, overrideAccess: true })
  }
  await payload.delete({ collection: 'calendars', id: c.id, overrideAccess: true })
}
const cal = await payload.db.create({
  collection: 'calendars',
  data: { owner: ${USER_ID}, year: 2026, month: 8, status: 'draft', updatedAt: now, createdAt: now },
})
process.stdout.write('CAL_ID=' + cal.id + '\n')
process.exit(0)
TSEOF

  SEED_OUT=$(docker compose exec -T app pnpm exec tsx /app/tasks/verify/.tmp-seed-028.ts 2>/dev/null || true)
  CAL_ID=$(echo "$SEED_OUT" | grep 'CAL_ID=' | sed 's/CAL_ID=//' | tr -d '[:space:]' || true)
  [ -n "$CAL_ID" ] || { echo "FAIL: nie udało się seedować kalendarza: $SEED_OUT"; exit 1; }
  echo "Seedowano draft kalendarz id=$CAL_ID"

  # Test 1: draft calendar with no days → placeholder
  BODY=$(curl -s -b "$COOKIE_JAR" "http://localhost:3000/kalendarz/${CAL_ID}/plan")
  echo "$BODY" | grep -qi 'Generujemy plan\|generujemy' \
    || { echo "FAIL: brak placeholdera dla draft kalendarza (body: ${BODY:0:300})"; exit 1; }
  echo "OK: placeholder dla draft kalendarza"

  # Seed: add days to the calendar
  cat > "$SEED_TS" <<TSEOF2
import { getPayload } from 'payload'
import config from '@payload-config'
const payload = await getPayload({ config })
const now = new Date().toISOString()
for (let d = 1; d <= 5; d++) {
  await payload.db.create({
    collection: 'days',
    data: { calendar: ${CAL_ID}, day: d, occasion: 'Okazja ' + d, motif: 'Motyw ' + d, updatedAt: now, createdAt: now },
  })
}
console.log('days seeded')
process.exit(0)
TSEOF2
  docker compose exec -T app pnpm exec tsx /app/tasks/verify/.tmp-seed-028.ts > /dev/null 2>&1 || true

  # Test 2: calendar with days → table
  BODY2=$(curl -s -b "$COOKIE_JAR" "http://localhost:3000/kalendarz/${CAL_ID}/plan")
  echo "$BODY2" | grep -qi 'Okazja\|Motyw\|Dzień\|plan-table' \
    || { echo "FAIL: brak tabeli po dodaniu days (body: ${BODY2:0:300})"; exit 1; }
  echo "OK: tabela widoczna po dodaniu days"
else
  echo "Pominięto test auth (ENABLE_DEV_LOGIN nie jest true)"
fi

echo "=== verify 028: OK ==="
