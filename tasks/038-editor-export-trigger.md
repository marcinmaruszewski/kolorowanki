---
id: 038
title: Trigger eksportu PDF z edytora
type: feat
status: pending
depends_on: [037]
touches:
  - src/app/(app)/kalendarz/[id]/edytor/actions.ts
  - src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx
---

## Cel

Przycisk „Pobierz PDF" → save layout + enqueue job do kolejki `pdf` → przekierowanie na stronę z postępem (task 040) lub od razu download gdy gotowe.

## Zakres (DO)

- [ ] Server Action `exportPdf(calendarId)`:
  - save layout (jak w 037)
  - enqueue BullMQ `pdf` queue z `{ calendarId }`
  - tworzy `generationJob` type `pdf`
  - zwraca `{ jobId }`
- [ ] Przycisk w toolbar „Pobierz PDF" → wywołuje action → redirect `/kalendarz/[id]/pobierz?job=<id>`.

## Poza zakresem (DON'T)

- Worker PDF — task 041.
- Renderowanie PDF — task 039.

## Kryteria akceptacji

- Klik → powstaje generationJob + redirect.

## Weryfikacja automatyczna

`tasks/verify/038.sh`: vitest mock enqueue.

## Weryfikacja manualna

- [ ] Kliknij w edytorze „Pobierz PDF" → zobacz stronę pobrania.

## Notatki dla agenta

- Jeśli już istnieje pending/running `pdf` job dla tego calendarId — nie enqueue nowego, zwróć istniejący (idempotentność).
