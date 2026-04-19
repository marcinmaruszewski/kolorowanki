---
id: 006
title: Skonfiguruj kolekcję users z bazowymi polami
type: feat
status: done
depends_on: [005]
touches:
  - src/payload/collections/users.ts
  - src/payload.config.ts
  - src/payload-types.ts
---

## Cel

Ustawić kolekcję `users` z polami potrzebnymi dla ról i przyszłego Google OAuth. Auth na tym etapie działa po staremu (email + hasło), ale struktura pól jest już gotowa pod task „Google OAuth".

## Kontekst

Payload domyślnie tworzy kolekcję `users` z email/password (powstała w tasku 005). Tu ją nadpisujemy własnym plikiem, dokładając pola `role`, `googleSub`, `calendarsThisMonth`, `quotaResetAt`.

## Zakres (DO)

- [ ] Utwórz `src/payload/collections/users.ts` eksportujący `Users: CollectionConfig`:
  - `slug: 'users'`
  - `auth: true`
  - `admin: { useAsTitle: 'email' }`
  - pola:
    - `email` (domyślne z `auth: true` — nic nie dodajesz)
    - `role`: `select` z `['user', 'admin']`, default `'user'`, `required: true`, `saveToJWT: true`
    - `googleSub`: `text`, `unique: true`, `index: true`, opcjonalne
    - `calendarsThisMonth`: `number`, default `0`, `required: true`, access `read: authenticated, update: () => false`
    - `quotaResetAt`: `date`, opcjonalne, access jw.
  - `access`:
    - `read`: user czyta swój rekord (`doc.id === req.user?.id`), admin czyta wszystkie
    - `update`: user edytuje swój rekord; pola `role`, `calendarsThisMonth`, `quotaResetAt` są zablokowane przez `access.update` na polu; admin edytuje wszystko
    - `delete`: tylko admin
    - `create`: publicznie otwarte (ograniczymy w tasku Google OAuth)
- [ ] Zarejestruj `Users` w `src/payload.config.ts` (`collections: [Users]`).
- [ ] Wygeneruj typy: `docker compose run --rm app pnpm generate:types`.

## Poza zakresem (DON'T)

- Nie implementuj Google OAuth (osobny task).
- Nie twórz kolekcji `calendars`/`days`.
- Nie dotykaj cron joba resetowania kwoty.
- Nie faktoryzuj pomocnika `isAdmin` — powtórz `req.user?.role === 'admin'` w kilku miejscach; wyodrębnimy po trzecim powtórzeniu.

## Kryteria akceptacji

- `src/payload/collections/users.ts` eksportuje `Users: CollectionConfig`.
- `docker compose run --rm app pnpm exec tsc --noEmit` bez błędów.
- `docker compose up -d` startuje, `http://localhost:3000/admin` działa.
- W admin UI tworzymy nowego usera — ma `role='user'`, `calendarsThisMonth=0`.
- Non-admin user próbujący PATCH na `/api/users/<own-id>` z polem `role: 'admin'` dostaje 403 lub 200 z niezmienionym `role`.
- `src/payload-types.ts` zawiera `role: 'user' | 'admin'` w interfejsie `User`.

## Weryfikacja automatyczna

`tasks/verify/006.sh`:
- `docker compose run --rm app pnpm exec tsc --noEmit`
- `docker compose run --rm app pnpm generate:types` i `grep "role: 'user' | 'admin'" src/payload-types.ts`
- `docker compose run --rm app pnpm vitest run tests/task-006`
  (testy integracyjne: POST `/api/users` → defaults; PATCH `role` przez non-admina → pole nie zmienione)

## Weryfikacja manualna

- [ ] Zaloguj się do `/admin` jako admin, otwórz kolekcję Users, zobacz pola `role` i `googleSub`.
- [ ] Utwórz nowego usera przez UI — default `role=user`, `calendarsThisMonth=0`.
- [ ] Zaloguj się jako ten user w incognito, spróbuj zmienić sobie `role` w Admin UI — zmiana nie przechodzi.

## Notatki dla agenta

- `saveToJWT: true` na `role` pozwala czytać rolę bez dodatkowego query przez middleware.
- Nazwa `calendarsThisMonth` musi zgadzać się z FR-2 z PRD — nie zmieniaj na `monthlyQuota` itp.
- Payload v3 przyjmuje `auth: true | AuthConfig` — prosty `true` wystarcza.
- Testy integracyjne wymagają żywego Postgresa z compose — verify skrypt sam go startuje jeśli trzeba.
