---
id: 007
title: Przygotuj konfigurację OAuth w Google Cloud Console i env vars
type: chore
status: done
depends_on: [006]
touches:
  - .env.example
  - docs/GOOGLE_OAUTH_SETUP.md
  - tasks/verify/007.sh
---

## Cel

Udokumentować krok po kroku konfigurację OAuth Client ID w Google Cloud Console i zdeklarować wymagane zmienne środowiskowe. Agent nie ma dostępu do Google Console — ten task przygotowuje instrukcję dla usera i placeholder'y w env.

## Zakres (DO)

- [ ] Utwórz `docs/GOOGLE_OAUTH_SETUP.md` z krokami: utworzenie projektu → ekran zgody OAuth (zewnętrzny, publishing status: testing OK w dev) → OAuth 2.0 Client ID (typ „Web application") → Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback` + `https://kolorowanki.marcinmaruszewski.me/api/auth/google/callback`.
- [ ] Dodaj do `.env.example`:
  ```
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
  ```
- [ ] W `docs/GOOGLE_OAUTH_SETUP.md` opisz jak dokleić te wartości do `.env`.

## Poza zakresem (DON'T)

- Nie implementuj kodu auth (to task 008).
- Nie modyfikuj innych plików poza `.env.example` i nowego dokumentu.

## Kryteria akceptacji

- `docs/GOOGLE_OAUTH_SETUP.md` istnieje, ma pełną instrukcję.
- `.env.example` zawiera `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

## Weryfikacja automatyczna

`tasks/verify/007.sh` — grep zmiennych w `.env.example`, test obecności `docs/GOOGLE_OAUTH_SETUP.md`.

## Weryfikacja manualna

- [ ] User (nie agent) przechodzi przez instrukcję w Google Cloud Console i wypełnia `.env`.
- [ ] User otwiera URL startowy w przeglądarce (po tasku 008) i widzi ekran zgody Google.

## Notatki dla agenta

- Nie próbuj „sprawdzać" w Google Console — to user ma tam dostęp.
- Redirect URI **musi** zgadzać się co do znaku z whitelistą w Google Console, inaczej Google zwróci błąd `redirect_uri_mismatch`.
