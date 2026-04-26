---
id: 044
title: Promowanie usera do roli admin (CLI script)
type: feat
status: done
depends_on: [006]
touches:
  - scripts/promote-admin.ts
  - docs/AGENTS.md
  - tasks/verify/044.sh
  - tests/task-044/promote-admin-args.test.ts
---

## Cel

Prosty skrypt node do ustawiania `role='admin'` dla danego emaila, żeby Marcin mógł się zalogować Google i potem promować siebie. Uruchamiany wewnątrz kontenera `app`.

## Zakres (DO)

- [ ] `scripts/promote-admin.ts`:
  - `tsx scripts/promote-admin.ts --email=kontakt@marcinmaruszewski.me`
  - ładuje Payload, `payload.update({ collection: 'users', where: { email: { equals } }, data: { role: 'admin' } })`
  - wypisuje confirm
- [ ] Docs AGENTS.md: sekcja „Promowanie admin" z komendą `docker compose exec app tsx scripts/promote-admin.ts --email=...`.

## Poza zakresem (DON'T)

- UI admin-management — MVP bez tego.

## Kryteria akceptacji

- Po uruchomieniu — user ma role='admin' w DB.

## Weryfikacja automatyczna

`tasks/verify/044.sh`: vitest na parsowanie args.

## Weryfikacja manualna

- [ ] Stwórz usera, promuj, sprawdź w admin UI.

## Notatki dla agenta

- Użyj minimist lub process.argv parsing — nie instaluj ciężkiego CLI frameworka.
