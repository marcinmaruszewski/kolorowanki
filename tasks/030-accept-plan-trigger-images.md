---
id: 030
title: Akceptacja planu — trigger batch generacji obrazków
type: feat
status: done
depends_on: [022, 029]
touches:
  - src/app/(app)/kalendarz/[id]/plan/actions.ts
  - src/app/(app)/kalendarz/[id]/plan/plan-table.tsx
  - src/app/(app)/kalendarz/[id]/plan/page.tsx
  - src/jobs/enqueue-images.ts
  - src/payload/collections/calendars.ts
  - src/payload-types.ts
  - src/app/(app)/kalendarze/calendar-card.tsx
  - tasks/verify/028.sh
  - tasks/verify/030.sh
  - tests/task-028/plan-page.test.ts
  - tests/task-030/enqueue-images.test.ts
---

## Cel

Przycisk „Wygeneruj obrazki" → server action buduje payload batch (wszystkie dni → prompty przez `buildImagePrompt`), submit do OpenAI (task 018), enqueue job do kolejki `images` z `batchId` + `calendarId`, status kalendarza → `plan_accepted`, redirect `/kalendarz/[id]/obrazki`.

## Zakres (DO)

- [ ] `src/jobs/enqueue-images.ts`:
  - `enqueueImagesBatch(calendarId)` — ładuje calendar+days, buduje `requests[]` (po 1 na day, endpoint `/v1/images/generations`), `submitBatch(requests)`, tworzy `generationJob` z `type='images-batch'`, wrzuca do BullMQ `images` queue (job polluje status co 60 s).
- [ ] Server Action `acceptPlan(calendarId)`:
  - guard status draft
  - wywołuje `enqueueImagesBatch`
  - `payload.update` calendar.status → 'plan_accepted'
  - redirect

## Poza zakresem (DON'T)

- Worker (już jest w 022).
- UI gallery — task 031.

## Kryteria akceptacji

- Po kliknięciu: pojawia się `generationJob`, calendar.status zmieniony, redirect.

## Weryfikacja automatyczna

`tasks/verify/030.sh`: vitest z mockiem `submitBatch` — sprawdza że `requests.length === days.length`.

## Weryfikacja manualna

- [ ] Stwórz kalendarz, edytuj plan, kliknij Wygeneruj → sprawdź admin `/admin/collections/generation-jobs`.

## Notatki dla agenta

- `requests[i].custom_id = day.id` — ważne dla worker do mapowania.
- `body.response_format = 'b64_json'` — mniej kłopotów niż URL.
