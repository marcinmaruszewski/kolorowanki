---
id: 049
title: Skrypt smoke test produkcji (curl + login)
type: chore
status: pending
depends_on: [047]
touches:
  - scripts/smoke-prod.sh
---

## Cel

Skrypt bash wywoływany po każdym deployu — sprawdza `GET /`, `GET /login`, `GET /admin`, `POST /api/auth/dev-login` (jeśli ENABLE_DEV_LOGIN=true na staging, w prod: off), healthcheck workera przez BullBoard API.

## Zakres (DO)

- [ ] `scripts/smoke-prod.sh`:
  - args: `BASE_URL` (np. `https://kolorowanki.marcinmaruszewski.me`)
  - curl każdego endpointa, assert HTTP 200/302
  - exit 1 przy pierwszym błędzie
  - kolorowane output (✓ / ✗)

## Poza zakresem (DON'T)

- CI integration — na przyszłość.

## Kryteria akceptacji

- `./scripts/smoke-prod.sh https://staging.example.com` wypisuje wszystkie checks i exit 0.

## Weryfikacja automatyczna

`tasks/verify/049.sh`: shellcheck + test z mockowym local server.

## Weryfikacja manualna

- [ ] Marcin odpala po deployu.

## Notatki dla agenta

- Używaj `curl -sSf -o /dev/null -w '%{http_code}'` do izolacji statusu.
