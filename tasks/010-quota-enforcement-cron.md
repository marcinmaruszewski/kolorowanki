---
id: 010
title: Egzekwuj limit 1 kalendarza/miesiąc + cron reset
type: feat
status: pending
depends_on: [009]
touches:
  - src/payload/hooks/enforce-calendar-quota.ts
  - src/jobs/quota-reset-cron.ts
  - src/payload.config.ts
---

## Cel

Zaimplementować hook na tworzeniu kalendarza sprawdzający limit `calendarsThisMonth` (FR-2 z PRD) i cron odpalany codziennie, który pierwszego dnia miesiąca resetuje licznik wszystkim userom.

## Zakres (DO)

- [ ] `src/payload/hooks/enforce-calendar-quota.ts` — `beforeChange` hook dla kolekcji `calendars` (powstanie w tasku 011 — ten task deklaruje hook, ale zarejestrujemy go w 011):
  - if `operation === 'create'` i `req.user.role !== 'admin'`:
    - załaduj usera: `calendarsThisMonth`
    - if `calendarsThisMonth >= 1` → throw `APIError('Przekroczono limit 1 kalendarza na miesiąc', 403)`
    - inkrementuj `calendarsThisMonth` (przez `payload.update` z `overrideAccess: true`)
- [ ] `src/jobs/quota-reset-cron.ts` — funkcja `resetMonthlyQuotasIfFirstOfMonth(payload)`:
  - jeśli `new Date().getDate() !== 1` → return (no-op)
  - `payload.update({ collection: 'users', where: {}, data: { calendarsThisMonth: 0, quotaResetAt: new Date() } })` — masowo dla wszystkich
- [ ] W `src/payload.config.ts` skonfiguruj cron przez Payload v3 jobs system (scheduled task) — codziennie o 00:05 UTC uruchamia `resetMonthlyQuotasIfFirstOfMonth`.

## Poza zakresem (DON'T)

- Hook zostanie **zarejestrowany** na kolekcji `calendars` dopiero w tasku 011 (bo kolekcja jeszcze nie istnieje). Tu tylko tworzymy funkcję hook'a.
- Nie implementuj UI informującego usera o limicie (task 027 — kreator nowego kalendarza).

## Kryteria akceptacji

- Funkcja `enforceCalendarQuota` eksportowana z pliku, gotowa do zarejestrowania.
- `resetMonthlyQuotasIfFirstOfMonth` przetestowana: wywołana 1. dnia miesiąca → resetuje; w inne dni → no-op.
- Payload config ma zarejestrowany scheduled job.

## Weryfikacja automatyczna

`tasks/verify/010.sh`:
- tsc noEmit
- `pnpm vitest run tests/task-010` (mockowane `Date`, testy obu gałęzi + hook'a z mockowanym payload)

## Weryfikacja manualna

- [ ] W Payload Admin UI ręcznie ustaw userowi `calendarsThisMonth=1`. W tasku 011, po zarejestrowaniu hook'a, próba utworzenia kalendarza kończy się 403.
- [ ] Ręcznie wywołaj `resetMonthlyQuotasIfFirstOfMonth` z mockiem daty → liczniki 0.

## Notatki dla agenta

- Admin nie podlega limitom (FR-2.3) — sprawdzaj `req.user.role`.
- `overrideAccess: true` w `payload.update` jest konieczne, bo user nie ma prawa sam edytować `calendarsThisMonth` (task 006).
- Payload v3 scheduled tasks: https://payloadcms.com/docs/jobs-queue/jobs — sprawdź aktualną składnię (może się różnić od v2).
