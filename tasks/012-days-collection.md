---
id: 012
title: Utwórz kolekcję days z relacją do calendars
type: feat
status: pending
depends_on: [011]
touches:
  - src/payload/collections/days.ts
  - src/payload.config.ts
  - src/payload-types.ts
---

## Cel

Zdefiniować kolekcję `days` reprezentującą jeden dzień miesiąca w kalendarzu (FR-4, FR-5). Relacja z `calendars`, pole obrazu, prompt, status generacji.

## Zakres (DO)

- [ ] `src/payload/collections/days.ts`:
  - `slug: 'days'`
  - pola:
    - `calendar`: relationship → calendars, required, `hasMany: false`
    - `day`: number, required, min 1, max 31
    - `weekday`: select (pon..niedz) — wypełniane w researchu
    - `occasion`: text (np. „Święto Pracy", „Wniebowstąpienie")
    - `motif`: textarea — propozycja symbolu
    - `prompt`: textarea — finalny prompt do modelu obrazowego
    - `image`: upload → media (null dopóki obraz niewygenerowany)
    - `status`: select [`planned`, `prompting`, `generating`, `generated`, `failed`], default `planned`
    - `sources`: array (group z polem `url` text) — linki ze researchu
  - `access`: user czyta/edytuje tylko days swojego calendara (query przez join), admin wszystko
  - indeks unikalny na (`calendar`, `day`)

## Poza zakresem (DON'T)

- Nie implementuj researchu (task 016).
- Nie implementuj generacji obrazków (task 022).

## Kryteria akceptacji

- Utworzenie kalendarza + ręcznie days w admin UI działa.
- Nie można utworzyć dwóch days o tym samym `(calendar, day)`.
- Non-owner user nie widzi days cudzego calendara.

## Weryfikacja automatyczna

`tasks/verify/012.sh`:
- tsc, generate types
- `pnpm vitest run tests/task-012`

## Weryfikacja manualna

- [ ] Admin UI → Calendars → otwórz kalendarz → sekcja „Related" pokazuje days.
- [ ] Przetestuj unique constraint.

## Notatki dla agenta

- Pole `image` typu `upload` automatycznie tworzy relację do kolekcji media (task 014).
- Nie twórz `beforeChange` generującego domyślne days przy create calendara — to robi worker researchu (task 021).
