---
id: 011
title: Utwórz kolekcję calendars
type: feat
status: done
depends_on: [010]
touches:
  - src/payload/collections/calendars.ts
  - src/payload.config.ts
  - src/payload-types.ts
  - tasks/verify/011.sh
  - tests/task-011/calendars-collection.test.ts
---

## Cel

Zdefiniować kolekcję `calendars` (FR-3) z relacją do usera, statusem, rokiem/miesiącem, seriesDirection i zintegrować hook quota z taska 010.

## Zakres (DO)

- [ ] `src/payload/collections/calendars.ts`:
  - `slug: 'calendars'`
  - `admin: { useAsTitle: 'label' }` (gdzie `label` = computed pole `YYYY-MM`)
  - pola:
    - `year`: number, required, min 2025, max 2100
    - `month`: number, required, min 1, max 12
    - `owner`: relationship → users, required, default to `req.user.id`
    - `status`: select [`draft`, `planned`, `generated`, `composed`, `exported`], default `draft`, required
    - `seriesDirection`: textarea, opcjonalne (wspólne zasady stylu serii)
    - `planMd`: textarea, opcjonalne (raw markdown z researchu)
    - `label`: text, `hooks.beforeChange: [({data}) => \`\${data.year}-\${String(data.month).padStart(2,'0')}\`]`, readonly admin
  - `hooks.beforeChange: [enforceCalendarQuota]` (import z taska 010)
  - `access`:
    - `read`: user czyta swoje (`where: { owner: { equals: req.user.id } }`), admin wszystkie
    - `create`: zalogowani
    - `update`: owner + admin
    - `delete`: owner + admin
  - indeks unikalny na (`owner`, `year`, `month`) → nie można mieć dwóch dla tej samej pary (FR-3.2)
- [ ] Zarejestruj w `payload.config.ts`.
- [ ] `pnpm generate:types`.

## Poza zakresem (DON'T)

- Nie twórz `days` (task 012).
- Nie dodawaj UI (task 026+).

## Kryteria akceptacji

- Tworzenie kalendarza w Admin UI zapisuje rekord z `owner`, `year`, `month`, `status='draft'`.
- Drugi kalendarz dla tej samej `(owner, year, month)` → błąd walidacji.
- User z `calendarsThisMonth=1` próbujący utworzyć kalendarz → 403 (hook z taska 010).
- User widzi w `/api/calendars` tylko swoje kalendarze.

## Weryfikacja automatyczna

`tasks/verify/011.sh`:
- tsc, generate types, grep na `interface Calendar` w payload-types
- `pnpm vitest run tests/task-011` — integration (quota enforcement, unique constraint)

## Weryfikacja manualna

- [ ] Admin UI → Calendars → Create → zapis z year=2026, month=5.
- [ ] Próba drugiego dla tego samego miesiąca → error.
- [ ] Incognito login jako inny user → nie widzi poprzedniego.

## Notatki dla agenta

- Unikalny indeks Postgres w Payload v3: `indexes` w CollectionConfig (sprawdź aktualne docs).
- `label` computed — przy zmianie roku/miesiąca przeliczy się w `beforeChange`.
