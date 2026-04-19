---
id: 041
title: Worker kolejki PDF (renderuje + zapisuje media)
type: feat
status: pending
depends_on: [020, 039]
touches:
  - src/jobs/pdf-worker.ts
  - src/jobs/worker-entry.ts
---

## Cel

Worker dla kolejki `pdf` konsumuje joby, wywołuje `renderCalendarPdf(calendarId)`, zapisuje buffer jako media (`collection: 'media'`), ustawia `calendar.pdfFile` i `calendar.status='ready'`.

## Zakres (DO)

- [ ] `src/jobs/pdf-worker.ts`:
  - jobPayload: `{ calendarId }`
  - `buffer = await renderCalendarPdf(calendarId)`
  - `media = await payload.create({ collection: 'media', data: {}, file: { data: buffer, name: 'kalendarz.pdf', mimetype: 'application/pdf', size: buffer.length } })`
  - `payload.update calendars` → `pdfFile: media.id, status: 'ready'`
  - update `generationJob` → `status='completed'`
- [ ] Zarejestruj w `worker-entry.ts`.

## Poza zakresem (DON'T)

- Kompresja PDF (pdf-lib produkuje dość zwięzły output).

## Kryteria akceptacji

- Job kończy się < 30 s dla 31-dniowego kalendarza.
- `calendar.status='ready'`, `pdfFile` ustawione.

## Weryfikacja automatyczna

`tasks/verify/041.sh`: vitest — mock renderCalendarPdf, sprawdź sekwencję wywołań.

## Weryfikacja manualna

- [ ] Wyeksportuj PDF dla realnego kalendarza w 31 dni, pobierz.

## Notatki dla agenta

- Przy błędzie: `generationJob.status='failed'`, `errorLog=String(err)`.
- Volume `/app/media` musi istnieć (zapewnione przez docker-compose task 014).
