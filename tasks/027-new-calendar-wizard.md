---
id: 027
title: Kreator nowego kalendarza (wybór roku i miesiąca)
type: feat
status: done
depends_on: [021, 026]
touches:
  - src/app/(app)/kalendarz/nowy/page.tsx
  - src/app/(app)/kalendarz/nowy/actions.ts
  - src/styles/globals.css
  - tasks/verify/027.sh
---

## Cel

`/kalendarz/nowy` — formularz wyboru roku (bieżący + następny) i miesiąca (1-12). Po submit: tworzy kalendarz, enqueue'uje job research (task 021), redirect na `/kalendarz/[id]/plan`.

## Zakres (DO)

- [ ] Page: grid 12 miesięcy po polsku („Styczeń", „Luty" …), select roku.
- [ ] Server Action `createCalendar(year, month)`:
  - `payload.create({ collection: 'calendars', data: { owner: user.id, year, month, status: 'draft' } })` — hook z taska 010/011 rzuci 403 jeśli limit.
  - Catch błędu quota → pokaż user-friendly komunikat „Wygenerowałeś już kalendarz w tym miesiącu. Spróbuj od 1. dnia następnego miesiąca."
  - Catch duplikatu (`unique (owner, year, month)`) → „Masz już kalendarz na ten miesiąc — otwórz go zamiast tworzyć nowy."
  - Sukces: `enqueueResearch(calendarId)`, redirect `/kalendarz/<id>/plan`

## Poza zakresem (DON'T)

- Nie dodawaj walidacji roku > 2100 (kolekcja `calendars` ma min/max — wystarczy).

## Kryteria akceptacji

- User bez limitu: tworzy kalendarz, redirect na plan.
- User z limitem: widzi komunikat PL.
- User próbujący drugiego dla (year, month): komunikat.

## Weryfikacja automatyczna

`tasks/verify/027.sh`: Playwright e2e + vitest na Server Action.

## Weryfikacja manualna

- [ ] Utwórz kalendarz jako user, zobacz toast + redirect.
- [ ] Spróbuj drugi raz → friendly error.

## Notatki dla agenta

- Miesiące po polsku w Mianowniku (Styczeń, Luty).
- Dla roku: default bieżący, opcja `bieżący` i `bieżący+1`.
