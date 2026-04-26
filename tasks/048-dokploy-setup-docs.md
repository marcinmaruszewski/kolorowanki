---
id: 048
title: Dokumentacja deploy na Dokploy
type: docs
status: done
depends_on: [047]
touches:
  - docs/DEPLOY.md
  - tasks/verify/048.sh
---

## Cel

`docs/DEPLOY.md` — krok-po-kroku jak Marcin podpina projekt do Dokploy: stworzenie stacka, ENV, domeny, volumes, cron triggery.

## Zakres (DO)

- [ ] Sekcje:
  1. Wymagania (Dokploy, domain DNS, Google OAuth credentials, OpenAI key)
  2. Tworzenie stacka w Dokploy (Compose type, repo URL, branch)
  3. ENV variables (lista z `.env.production.example`)
  4. Domain mapping: `kolorowanki.marcinmaruszewski.me` → `app` service, port 3000
  5. Volumes (media, postgres-data) — konfiguracja named volumes w Dokploy
  6. Cron jobs (task 010 reset quoty) — Dokploy built-in cron lub `docker exec`
  7. Pierwsza promocja admina (task 044)
  8. Smoke test po deploy (task 049)

## Poza zakresem (DON'T)

- Nie pisz tutoriala samego Dokploy — link do docs.

## Kryteria akceptacji

- Marcin czyta jeden dokument i wdraża bez pomocy.

## Weryfikacja automatyczna

`tasks/verify/048.sh`: brak (docs only) — `grep -c '##' docs/DEPLOY.md >= 7`.

## Weryfikacja manualna

- [ ] Marcin przechodzi przez checklistę na świeżej instalacji.

## Notatki dla agenta

- Podlinkuj odpowiednie taski (010, 044, 049).
