---
id: 022
title: Worker obrazków batch — submit, poll, zapisz PNG do media
type: feat
status: done
depends_on: [014, 017, 018, 021]
touches:
  - src/jobs/images-worker.ts
  - src/jobs/worker-entry.ts
  - src/jobs/__tests__/images-worker.test.ts
  - tasks/verify/022.sh
---

## Cel

Worker BullMQ, który dla `{ calendarId }`:
1. ładuje wszystkie `days` danego kalendarza (status=`planned`)
2. buduje prompty przez `buildImagePrompt` (task 017)
3. submituje batch do `/v1/images/generations` (task 018)
4. pollinguje status
5. po completed: dla każdego wyniku zapisuje PNG do `media` z relacją do `day`, update `day.status='generated'`, `day.image=<media-id>`, `day.prompt`
6. update `calendar.status='generated'`
7. `generationJob` koszty + status

## Zakres (DO)

- [ ] `src/jobs/images-worker.ts` — worker kolejki `images`:
  - walk podobny do 021, ale z image endpoint
  - `custom_id: day-<calendarId>-<day>`
  - per każdy completed response: base64 PNG → plik → `payload.create({ collection: 'media', file: Buffer, data: { calendar, alt: 'Dzień <N>' } })` → update `day.image`
  - jeśli któryś obraz w batchu failed (częściowy sukces): update `day.status='failed'` tylko dla tych, kalendarz jako całość `generated`

## Poza zakresem (DON'T)

- Nie implementuj regeneracji pojedynczej (task 023).

## Kryteria akceptacji

- Kalendarz ze wszystkimi days w status=`planned` po joba → wszystkie `day.image` wypełnione, `calendar.status='generated'`.
- Częściowy fail → `calendar.status='generated'` + oznaczone problematyczne days.

## Weryfikacja automatyczna

`tasks/verify/022.sh`: vitest z mock'owanym OpenAI batch (fakeowany PNG w base64).

## Weryfikacja manualna

- [ ] Kalendarz z `planned` → enqueue images → po 10-15 min 30 PNG w `./media/`.
- [ ] Admin UI → Days → miniatury obrazków.

## Notatki dla agenta

- Rozmiar: `size: '1024x1024'` wystarczy dla kafelka na A4.
- `background: 'opaque'`, `quality: 'medium'` jako default (tańsze).
- Nie konwertuj do greyscale — prompt mówi b/w, model to zrobi.
- Uwaga na base64 → Buffer: SDK v4 OpenAI zwraca `b64_json` w response.
