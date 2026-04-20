---
id: 024
title: Strona logowania (PL) z przyciskiem Google
type: feat
status: done
depends_on: [008]
touches:
  - src/app/(app)/login/page.tsx
  - src/app/(app)/layout.tsx
  - src/styles/globals.css
  - tasks/verify/024.sh
---

## Cel

Publiczna strona `/login` — jedno centrum logowania (FR-1). Duży przycisk „Zaloguj Google" → link do `/api/auth/google/start`. Pod spodem, jeśli `ENABLE_DEV_LOGIN=true`, mały inline form dev-login (email + submit).

## Zakres (DO)

- [ ] `src/app/(app)/layout.tsx` — root layout aplikacyjny (nagłówek „Kalendarz", minimalistyczny CSS, PL `lang="pl"`).
- [ ] `src/app/(app)/login/page.tsx`:
  - Nagłówek: „Zaloguj się, żeby wygenerować kalendarz kolorowanek"
  - `<a href="/api/auth/google/start">` jako przycisk (brand-safe Google button — prosty, bez cudów)
  - Server Component sprawdza `process.env.ENABLE_DEV_LOGIN` — jeśli `true`, renderuje sekcję „Dev login" z `<form>` POST do `/api/auth/dev-login`
- [ ] `src/styles/globals.css` — minimalne style (font sans-serif, kolory, prosty layout).

## Poza zakresem (DON'T)

- Nie buduj pełnego design systemu — MVP.
- Nie dodawaj loginów innymi dostawcami.

## Kryteria akceptacji

- GET `/login` zwraca 200, HTML zawiera przycisk Google.
- Z `ENABLE_DEV_LOGIN=true` widoczny dev-form; bez tej flagi — ukryty.
- Kliknięcie Google → redirect do Google consent (zakłada całość 008 działa).

## Weryfikacja automatyczna

`tasks/verify/024.sh`: Playwright e2e — otwiera `/login`, asserted text.

## Weryfikacja manualna

- [ ] `/login` wygląda OK w przeglądarce.
- [ ] Real Google login — user klika sam.

## Notatki dla agenta

- Grupa route `(app)` izoluje UI aplikacyjne od Payload admin pod `(payload)`.
- `lang="pl"` na `<html>` — ważne dla screen readerów i SEO.
