---
id: 021
title: Worker researchu — submit batch, poll, zapisz days
type: feat
status: done
depends_on: [012, 013, 016, 018, 020]
touches:
  - src/jobs/research-worker.ts
  - src/jobs/worker-entry.ts
  - src/jobs/__tests__/research-worker.test.ts
  - tasks/verify/021.sh
---

## Cel

Worker BullMQ, który dla joba `{ calendarId }`:
1. buduje prompt (task 016)
2. submituje batch przez `/v1/responses` (task 018)
3. pollinguje co 30s status batcha
4. po completed: parsuje MonthPlan, tworzy rekordy `days`, aktualizuje `calendar.status='planned'` i `calendar.planMd`
5. zapisuje koszty i status w `generationJobs`

## Zakres (DO)

- [ ] `src/jobs/research-worker.ts` eksportuje `Worker` dla kolejki `research`:
  - jobPayload: `{ calendarId: string }`
  - krok 1: utwórz `generationJob` z `type='research'`, `status='queued'`
  - krok 2: build prompt, submit batch z `custom_id: research-<calendarId>`
  - krok 3: update jobu → `status='submitted'`, `openaiBatchId`, `startedAt=now`
  - krok 4: polling loop z `setTimeout(30_000)` (albo lepiej: BullMQ delayed job re-enqueue z backoffem); po `in_progress` → re-enqueue na 30s; po `completed` → krok 5; po `failed/expired` → `generationJob.status='failed'`, przerywamy
  - krok 5: download wyników, parse przez `MonthPlanSchema`, dla każdego dnia `payload.create({ collection: 'days', data: { calendar, day, weekday, occasion, motif, sources, status: 'planned' } })`, update calendar `status='planned'`, `planMd` = raw markdown z response
- [ ] Zarejestruj worker w `src/jobs/worker-entry.ts`.

## Poza zakresem (DON'T)

- Nie dotykaj images workera (task 022).
- Nie rób UI przycisku „Utwórz kalendarz" (task 027).

## Kryteria akceptacji

- Job z `calendarId` wygenerowanego „ręcznie" w admin UI → po poll+completed → Kalendarz ma `status='planned'` i wszystkie `days` zapisane.
- Gdy batch `failed` → `generationJob.status='failed'`, `errorLog` zapisane.
- Retry joba (BullMQ domyślne) max 3x przy błędach sieciowych.

## Weryfikacja automatyczna

`tasks/verify/021.sh`: vitest z mock'owanym OpenAI batch — happy path + failed path.

## Weryfikacja manualna

- [ ] Utwórz w Admin UI `calendar` dla 2026/5.
- [ ] Ręcznie enqueue: `docker compose exec app node -e "import('./src/lib/queue/queues.ts').then(m=>m.enqueueResearch('<calendar-id>'))"`
- [ ] Obserwuj `docker compose logs -f worker` przez 10-15 min.
- [ ] Po completed: `/admin/collections/days` pokazuje 31 dni.

## Notatki dla agenta

- Polling przez `setTimeout` w worker procesie jest prosty, ale blokuje slot BullMQ. Lepsze: wyrzuć re-enqueue z `delay: 30000` — zwalnia concurrency slot.
- Zapisuj `completedAt` i `costUsd` po sukcesie (koszt z response `usage` lub z pliku batch error).
- Idempotencja: jeśli dla `(calendar, day)` istnieje już `day`, zrób `upsert`, nie duplikuj.
