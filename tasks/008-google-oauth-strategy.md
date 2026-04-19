---
id: 008
title: Zaimplementuj Google OAuth strategy i callback
type: feat
status: pending
depends_on: [007]
touches:
  - package.json
  - pnpm-lock.yaml
  - src/app/api/auth/google/start/route.ts
  - src/app/api/auth/google/callback/route.ts
  - src/lib/auth/google.ts
  - src/payload/collections/users.ts
---

## Cel

Zaimplementować custom strategię Google OAuth zgodną z ADR-007: endpointy `/api/auth/google/start` (redirect do Google) i `/api/auth/google/callback` (weryfikacja ID tokena, upsert usera po `googleSub`, wystawienie `payload-token` cookie).

## Zakres (DO)

- [ ] Zainstaluj: `docker compose run --rm app pnpm add google-auth-library`
- [ ] `src/lib/auth/google.ts`:
  - `buildAuthUrl(state: string)` — buduje URL do Google (`accounts.google.com/o/oauth2/v2/auth`) z `client_id`, `redirect_uri`, `scope=openid email profile`, `response_type=code`, `state`
  - `exchangeCodeForIdToken(code: string)` — POST do `oauth2.googleapis.com/token`, zwraca `{ sub, email, emailVerified, name }`
- [ ] `src/app/api/auth/google/start/route.ts` — GET:
  - generuje random `state`, zapisuje do cookie HttpOnly (5 min TTL)
  - 302 redirect do `buildAuthUrl(state)`
- [ ] `src/app/api/auth/google/callback/route.ts` — GET:
  - weryfikuje `state` z cookie (CSRF protection)
  - woła `exchangeCodeForIdToken`
  - upsert usera w Payload: `payload.find({ collection: 'users', where: { googleSub: { equals: sub } } })` lub `payload.create({ ... role: 'user', googleSub, email })`
  - generuje Payload JWT i zwraca cookie `payload-token` (patrz `payload.login` docs)
  - 302 redirect do `/kalendarze`
- [ ] Zaktualizuj `src/payload/collections/users.ts`: `access.create` z „publicznie otwarte" na „tylko server-side via payload.create (brak REST)" — ograniczenie, bo od teraz tworzenie usera idzie tylko przez callback.

## Poza zakresem (DON'T)

- Nie implementuj dev-login (task 009).
- Nie dodawaj UI przycisku „Zaloguj Google" (task 024).
- Nie dotykaj quota (task 010).

## Kryteria akceptacji

- GET `/api/auth/google/start` zwraca 302 z `Location` do `accounts.google.com`.
- GET `/api/auth/google/callback?code=…&state=…` z poprawnym state: upsert usera + cookie `payload-token` + 302 do `/kalendarze`.
- GET `/api/auth/google/callback` z błędnym `state`: 400.
- Istniejący user z tym samym `googleSub` nie jest duplikowany (upsert).

## Weryfikacja automatyczna

`tasks/verify/008.sh`:
- tsc noEmit
- `pnpm vitest run tests/task-008` — testy z mockowanym fetch'em do Google token endpoint

## Weryfikacja manualna

- [ ] User kończy setup z taska 007 (wypełnione `.env`).
- [ ] Otwórz `http://localhost:3000/api/auth/google/start` — redirect do Google.
- [ ] Zaloguj się swoim kontem Google → redirect z powrotem na `/kalendarze` (może być 404, bo page nie istnieje — liczy się cookie).
- [ ] DevTools → Application → Cookies → `payload-token` jest ustawione.
- [ ] W Postgres `SELECT email, role, "googleSub" FROM users` — user istnieje.

## Notatki dla agenta

- `state` musi być cryptographically random (użyj `crypto.randomBytes(32).toString('hex')`).
- Payload ma natywne `payload.login({ collection: 'users', data: {...} })` — użyj go, nie ręcznie klei JWT.
- `googleSub` z Google ID tokena (`sub`) jest stabilne nawet przy zmianie maila — to jest nasz unikalny klucz.
