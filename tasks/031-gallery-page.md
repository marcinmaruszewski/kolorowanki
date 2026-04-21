---
id: 031
title: Galeria wygenerowanych obrazków (grid 7 kolumn)
type: feat
status: done
depends_on: [022, 030]
touches:
  - src/app/(app)/kalendarz/[id]/obrazki/page.tsx
  - src/app/(app)/kalendarz/[id]/obrazki/day-tile.tsx
  - src/styles/globals.css
  - tasks/verify/031.sh
  - tests/task-031/gallery-page.test.ts
---

## Cel

`/kalendarz/[id]/obrazki` — grid 7 kolumn (kalendarzowo, poniedziałek-niedziela), każda kafelka = 1 dzień (obrazek + numer). Dla nieukończonych dni — placeholder („Generowanie…") + auto-refresh co 10 s.

## Zakres (DO)

- [ ] Server component ładuje calendar+days+media.
- [ ] Jeśli jakikolwiek day ma `status !== 'generated'` → `<meta refresh>` 10 s.
- [ ] `DayTile` renderuje `<img>` (Next `<Image>` może być problematyczny przez dynamic path, użyj zwykłego `<img src={media.url} />`).
- [ ] Przycisk „Do edytora" → `/kalendarz/[id]/edytor` — aktywny tylko gdy wszystkie dni `generated`.
- [ ] Przycisk „Regeneruj" per kafelka (otwiera modal — task 032).

## Poza zakresem (DON'T)

- Regeneracja jako feature — task 032/033.
- Fabric editor — task 035+.

## Kryteria akceptacji

- Siatka 7 kolumn, puste pierwsze kafelki dla dni_przed_1 (jeśli miesiąc zaczyna się w środku tygodnia).
- Polling do aż wszystkie generated.

## Weryfikacja automatyczna

`tasks/verify/031.sh`: Playwright — seed 31 days z media, otwórz stronę, policz kafelki = 31.

## Weryfikacja manualna

- [ ] Zobacz galerię po przetworzeniu batch.

## Notatki dla agenta

- `new Date(year, month-1, 1).getDay()` (JS: 0=niedz) → konwersja na poniedziałek=0.
- CSS: `grid-template-columns: repeat(7, 1fr); gap: 8px;`.
