---
id: 028
title: Strona planu kalendarza (read-only) z pollingiem statusu
type: feat
status: pending
depends_on: [021, 027]
touches:
  - src/app/(app)/kalendarz/[id]/plan/page.tsx
  - src/app/(app)/kalendarz/[id]/plan/plan-table.tsx
---

## Cel

`/kalendarz/[id]/plan` pokazuje tabelę dni (data, okazja, motyw) wygenerowaną przez research worker. Jeśli research jeszcze trwa — placeholder + auto-refresh co 5 s.

## Zakres (DO)

- [ ] Server component ładuje calendar + days (`payload.find` by calendar).
- [ ] Jeśli `calendar.status === 'draft'` i brak days → pokaż „Generujemy plan… (zwykle 10-15 min)" + `<meta http-equiv="refresh" content="5">`.
- [ ] Jeśli days są → `PlanTable` (read-only w tym tasku).
- [ ] Przycisk „Dalej: wygeneruj obrazki" disabled w tym tasku (odblokowany w 030).

## Poza zakresem (DON'T)

- Edycja — task 029.
- Trigger batch images — task 030.

## Kryteria akceptacji

- Dla kalendarza w trakcie research: widać placeholder.
- Dla kalendarza po research: widać 28-31 wierszy (zależnie od miesiąca).

## Weryfikacja automatyczna

`tasks/verify/028.sh`: Playwright — seed calendar z days, otwórz stronę, assert tabelka.

## Weryfikacja manualna

- [ ] Zobacz stronę po stworzeniu kalendarza — powinien być placeholder, potem (po 10-15 min) tabela.

## Notatki dla agenta

- Kolumny PL: „Dzień", „Okazja", „Motyw".
- Sortowanie po `day` rosnąco.
