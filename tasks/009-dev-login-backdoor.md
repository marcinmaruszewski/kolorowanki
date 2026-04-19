---
id: 009
title: Zaimplementuj dev-login backdoor do testów
type: feat
status: done
depends_on: [008]
touches:
  - src/app/api/auth/dev-login/route.ts
  - src/instrumentation.ts
  - .env.example
  - tasks/verify/009.sh
  - tests/task-009/dev-login.test.ts
---

## Cel

Udostępnić endpoint `POST /api/auth/dev-login`, który w dev/test pozwala zalogować się jako dowolny existing user bez Google OAuth. W prod endpoint zwraca 404 (niedostępny). Umożliwia Playwright'owi e2e testowanie UI bez interakcji z Google.

## Zakres (DO)

- [ ] Dodaj do `.env.example`: `ENABLE_DEV_LOGIN=true` (domyślnie w dev; w prod Dokploy NIE ustawiamy tej zmiennej).
- [ ] `src/app/api/auth/dev-login/route.ts`:
  - POST: body `{ email: string }`
  - **pierwszy check**: jeśli `process.env.ENABLE_DEV_LOGIN !== 'true'` → zwróć 404 (NextResponse, nie rzucaj błędu — udawaj że nie istnieje)
  - znajdź usera po email (`payload.find({ collection: 'users', where: { email: { equals: email } } })`)
  - jeśli nie istnieje: utwórz tymczasowego z `role: 'user'`, `googleSub: null`
  - wystaw cookie `payload-token` tak samo jak w prawdziwym callbacku Google (reuse helper z `src/lib/auth/google.ts` jeśli się da wyciągnąć, inaczej skopiuj — factor out w osobnym tasku jeśli urośnie)
  - zwróć 200 z `{ userId, email, role }`

## Poza zakresem (DON'T)

- Nie dodawaj UI dla dev-login (testy wołają endpoint bezpośrednio).
- Nie twórz endpointu dla „dev-logout" — zwykły DELETE na `payload-token` cookie przez frontend wystarczy.

## Kryteria akceptacji

- Z `ENABLE_DEV_LOGIN=true`: POST `/api/auth/dev-login` z `{ email: "test@example.com" }` zwraca 200 + cookie.
- Z `ENABLE_DEV_LOGIN` nieustawionym (lub innym niż `true`): 404.
- Kolejne wywołanie z tym samym email nie tworzy nowego usera (idempotent).

## Weryfikacja automatyczna

`tasks/verify/009.sh`:
- `pnpm vitest run tests/task-009` — testy: dostępność z flagą, 404 bez flagi, idempotencja

## Weryfikacja manualna

- [ ] `curl -X POST http://localhost:3000/api/auth/dev-login -H 'content-type: application/json' -d '{"email":"ja@test.pl"}' -i` → 200 + `Set-Cookie: payload-token=…`
- [ ] W `.env` zakomentuj `ENABLE_DEV_LOGIN`, restart `docker compose restart app`, powtórz curl → 404.

## Notatki dla agenta

- Endpoint **nigdy** nie może zostać włączony omyłkowo w prod — sam env var to za mało jeśli user wsadzi skopiowany `.env`. Rozważ dodanie `if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEV_LOGIN === 'true') throw` przy starcie aplikacji w `next.config.mjs` lub `instrumentation.ts`.
- W `docs/AGENTS.md` już jest opis jak korzystać z dev-login — nie duplikuj go w komentarzach kodu.
