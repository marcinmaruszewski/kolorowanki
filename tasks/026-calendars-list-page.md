---
id: 026
title: Strona listy moich kalendarzy
type: feat
status: pending
depends_on: [011, 025]
touches:
  - src/app/(app)/kalendarze/page.tsx
  - src/app/(app)/kalendarze/calendar-card.tsx
---

## Cel

Strona `/kalendarze` — lista kalendarzy zalogowanego usera, przycisk „Nowy kalendarz" prowadzący do `/kalendarz/nowy`.

## Zakres (DO)

- [ ] `src/app/(app)/kalendarze/page.tsx` — server component:
  - guard: jeśli brak usera → redirect `/login`
  - `payload.find({ collection: 'calendars', where: { owner: { equals: user.id } }, sort: '-createdAt' })`
  - grid kart (każdy kalendarz → `<CalendarCard>`)
  - CTA „+ Nowy kalendarz" → `/kalendarz/nowy`
- [ ] `CalendarCard` pokazuje `YYYY-MM`, status (badge), jeśli `generated` — miniaturki 3 dni, link do `/kalendarz/[id]/...` zależnie od statusu (draft → `/plan`, generated → `/obrazki`, composed → `/edytor`).

## Poza zakresem (DON'T)

- Nie twórz formularza tworzenia (task 027).
- Nie pokazuj kalendarzy innych userów.

## Kryteria akceptacji

- User widzi tylko swoje.
- Link CTA prowadzi do `/kalendarz/nowy`.

## Weryfikacja automatyczna

`tasks/verify/026.sh`: Playwright z dev-login.

## Weryfikacja manualna

- [ ] Zaloguj, otwórz `/kalendarze`.

## Notatki dla agenta

- Dla non-draft kalendarzy bez obrazków jeszcze — placeholder „Generowanie w toku".
