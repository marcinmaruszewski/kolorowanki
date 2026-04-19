---
id: 040
title: Strona pobrania PDF + API route
type: feat
status: pending
depends_on: [039]
touches:
  - src/app/(app)/kalendarz/[id]/pobierz/page.tsx
  - src/app/api/kalendarz/[id]/pdf/route.ts
---

## Cel

`/kalendarz/[id]/pobierz` pokazuje status (Pending/Running/Completed) z polling i linkiem „Pobierz PDF" gdy gotowe. API route `GET /api/kalendarz/[id]/pdf` serwuje plik PDF (auth: owner).

## Zakres (DO)

- [ ] `/pobierz/page.tsx`: ładuje generationJob (`type='pdf'`), auto-refresh co 3 s jeśli nie completed.
- [ ] Gdy `status='completed'` → pokaż button `<a href="/api/kalendarz/[id]/pdf" download>Pobierz PDF</a>`.
- [ ] `/api/kalendarz/[id]/pdf/route.ts`:
  - GET handler, auth check (owner lub admin)
  - czyta `calendar.pdfFile` (media ref) lub re-renderuje on-demand (fallback)
  - return `new Response(buffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="kalendarz-YYYY-MM.pdf"' } })`

## Poza zakresem (DON'T)

- Worker PDF — task 041.

## Kryteria akceptacji

- Po zakończeniu job — klikalny link pobiera PDF.
- Inny user próbujący pobrać cudzy → 403.

## Weryfikacja automatyczna

`tasks/verify/040.sh`: Playwright — download, assert mime.

## Weryfikacja manualna

- [ ] Pełny flow: edytuj → eksport → pobierz PDF.

## Notatki dla agenta

- `calendar.pdfFile` — pole relation do media, dodaj do kolekcji `calendars` w ramach tego tasku (bump migration).
