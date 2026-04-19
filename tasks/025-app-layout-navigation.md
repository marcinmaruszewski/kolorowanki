---
id: 025
title: Layout aplikacyjny + nawigacja auth-aware
type: feat
status: pending
depends_on: [024]
touches:
  - src/app/(app)/layout.tsx
  - src/components/nav-bar.tsx
  - src/lib/auth/current-user.ts
---

## Cel

Topbar aplikacyjny z logo „Kalendarz", linkami w zależności od stanu zalogowania, wylogowaniem. Server component ładuje zalogowanego usera z cookies.

## Zakres (DO)

- [ ] `src/lib/auth/current-user.ts` — `getCurrentUser(): Promise<User | null>` używa Payload local API (`payload.auth({ headers })`).
- [ ] `src/components/nav-bar.tsx`:
  - logo + link „Kalendarz" na `/`
  - jeśli user: link „Moje kalendarze", „Wyloguj" (POST do `/api/users/logout` — Payload endpoint)
  - jeśli brak: link „Zaloguj"
- [ ] Wepnij nav-bar w `src/app/(app)/layout.tsx`.

## Poza zakresem (DON'T)

- Nie dodawaj mobile hamburger menu — MVP.

## Kryteria akceptacji

- `/` pokazuje topbar, dynamicznie zależny od zalogowania.
- „Wyloguj" kasuje `payload-token`.

## Weryfikacja automatyczna

`tasks/verify/025.sh`: Playwright — login dev → topbar ma „Wyloguj", click → wylogowanie.

## Weryfikacja manualna

- [ ] Zaloguj/wyloguj w przeglądarce.

## Notatki dla agenta

- Payload v3 logout endpoint: `POST /api/users/logout` (automatyczny z `auth: true`).
