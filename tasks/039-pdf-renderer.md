---
id: 039
title: Renderer PDF (pdf-lib) z layoutJson
type: feat
status: done
depends_on: [034, 037]
touches:
  - src/lib/pdf/render-calendar.ts
  - src/lib/pdf/render-calendar.test.ts
  - package.json
  - tasks/verify/039.sh
---

## Cel

Funkcja `renderCalendarPdf(calendarId): Promise<Buffer>` — ładuje calendar, days, media files, layoutJson; używa `pdf-lib` do zbudowania A4 portrait PDF z osadzonymi PNG-ami w pozycjach/rotacjach z layoutJson.

## Zakres (DO)

- [ ] `pnpm add pdf-lib` (touches: package.json).
- [ ] `renderCalendarPdf(calendarId)`:
  - load calendar + days + media
  - parse `layoutJson` (fabric.js format) → mapa `dayId → {x, y, w, h, angle}`
  - jeśli brak layoutJson → użyj `buildSlots`
  - `PDFDocument.create()`, dodaj A4 stronę (595×842 pt)
  - dla każdego day: `embedPng(mediaBytes)` (read z `media.filePath`), rysuj z transformacją
  - `doc.save()` → `Buffer`
- [ ] Unit test: mock 3 media, sprawdź że PDF powstaje i ma >0 bajtów.

## Poza zakresem (DON'T)

- API route — task 040.

## Kryteria akceptacji

- Test vitest zielony.
- Wygenerowany PDF otwiera się w Adobe Reader i ma 1 stronę z obrazkami.

## Weryfikacja automatyczna

`tasks/verify/039.sh`: `pnpm vitest run render-calendar`.

## Weryfikacja manualna

- [ ] Wygeneruj PDF lokalnie na testowym kalendarzu, otwórz w viewerze.

## Notatki dla agenta

- fabric.js `angle` w stopniach; pdf-lib `drawImage` używa `rotate: degrees(n)`.
- fabric.js współrzędne: top-left, y rośnie w dół. pdf-lib: bottom-left, y rośnie w górę. Konwersja: `pdfY = pageHeight - fabricY - height`.
