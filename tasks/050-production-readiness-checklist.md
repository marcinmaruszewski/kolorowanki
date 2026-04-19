---
id: 050
title: Checklist gotowości produkcyjnej
type: docs
status: pending
depends_on: [001, 048, 049]
touches:
  - docs/PRODUCTION_CHECKLIST.md
---

## Cel

Ostateczny dokument — lista tego, co musi być spełnione przed ogłoszeniem MVP „live" na kolorowanki.marcinmaruszewski.me.

## Zakres (DO)

- [ ] `docs/PRODUCTION_CHECKLIST.md`:
  - [ ] Wszystkie taski 001-049 `status: done`
  - [ ] ENABLE_DEV_LOGIN=false w prod (sprawdzone manualnie)
  - [ ] Google OAuth redirect URIs zawierają produkcyjny URL
  - [ ] Payload secret (PAYLOAD_SECRET) losowo wygenerowany, min 32 znaki
  - [ ] Postgres backups skonfigurowane (Dokploy)
  - [ ] Media volume backups
  - [ ] Cron reset quoty działa (log pierwszego 1. dnia miesiąca)
  - [ ] Error monitoring: co najmniej log output grabbed przez Dokploy
  - [ ] Test e2e: kompletny flow (login → create → plan → obrazki → edytor → PDF) wykonany jako Marcin
  - [ ] Pierwszy user (self) promowany do admina
  - [ ] Budżet OpenAI API monitorowany (spending limit w OpenAI dashboard)

## Poza zakresem (DON'T)

- Pełny audit bezpieczeństwa — MVP.

## Kryteria akceptacji

- Każdy punkt checklisty odfajkowany przed ogłoszeniem.

## Weryfikacja automatyczna

`tasks/verify/050.sh`: grep `- \[x\]` count == grep `- \[ \]` count (wszystko ptaszkowane).

## Weryfikacja manualna

- [ ] Ostateczna weryfikacja: Marcin + czat z family beta-testerami.

## Notatki dla agenta

- To ostatni task. Po `./scripts/task done 050` → projekt gotowy.
