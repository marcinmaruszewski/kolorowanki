---
id: 042
title: Admin dashboard kosztów OpenAI
type: feat
status: pending
depends_on: [013]
touches:
  - src/app/(payload)/admin/components/CostDashboard.tsx
  - src/collections/Calendars.ts
---

## Cel

W panelu Payload admin — osobny widok/sekcja „Koszty" podsumowująca `generationJobs.costUsd` w bieżącym miesiącu. Admin-only.

## Zakres (DO)

- [ ] Custom view w Payload admin (`admin.components.views`):
  - SUM `generationJobs.costUsd` w tym miesiącu
  - breakdown per type (research/images-batch/single-image/pdf)
  - lista top-5 kalendarzy o największym koszcie
- [ ] Access: `admin.role === 'admin'`.

## Poza zakresem (DON'T)

- Eksport CSV — przyszłość.
- Budżetowe limity — przyszłość.

## Kryteria akceptacji

- Admin widzi kwotę w USD.
- Non-admin — 403 / nie widzi sekcji w menu.

## Weryfikacja automatyczna

`tasks/verify/042.sh`: Playwright — login jako admin, otwórz widok, assert tekst „$".

## Weryfikacja manualna

- [ ] Zaloguj jako admin, sprawdź kwoty po wygenerowaniu kalendarza.

## Notatki dla agenta

- Dokumentacja Payload v3 custom views: `payload-admin/views`.
- Aggregacja: `payload.find({ limit: 1000 })` + suma w JS (starcza dla skali MVP).
