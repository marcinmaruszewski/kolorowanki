---
id: 020
title: Dodaj kontener worker do docker-compose
type: chore
status: pending
depends_on: [019]
touches:
  - docker-compose.yml
  - src/jobs/worker-entry.ts
  - package.json
---

## Cel

Osobny proces Node uruchamiający workery BullMQ, w osobnym kontenerze docker-compose (ADR-003).

## Zakres (DO)

- [ ] `src/jobs/worker-entry.ts` — entrypoint który importuje i uruchamia wszystkie workery (na razie placeholder, workery dojdą w 021-023). Trzyma proces żywy z `process.on('SIGTERM', gracefulShutdown)`.
- [ ] W `package.json` dodaj script: `"worker": "tsx src/jobs/worker-entry.ts"` (zainstaluj tsx: `docker compose run --rm app pnpm add -D tsx`).
- [ ] W `docker-compose.yml` dodaj usługę `worker`:
  - `build: { context: ., dockerfile: Dockerfile }` (ten sam image co app)
  - `command: ["pnpm", "worker"]`
  - `env_file: .env`
  - `depends_on: postgres, redis` (healthchecków, jak app)
  - volumes i sieć jak app
  - `restart: unless-stopped`

## Poza zakresem (DON'T)

- Nie implementuj logiki workerów — tylko placeholder.

## Kryteria akceptacji

- `docker compose up -d worker` startuje kontener, `docker compose logs worker` pokazuje „Worker entrypoint started, awaiting jobs…".
- `SIGTERM` zamyka workera czysto w <5 s.

## Weryfikacja automatyczna

`tasks/verify/020.sh`: docker compose up worker, sprawdź logi, sprawdź exit na SIGTERM.

## Weryfikacja manualna

- [ ] `docker compose ps worker` → running.

## Notatki dla agenta

- Nie duplikuj Dockerfile'a — ten sam image co `app`, inny command.
- tsx pozwala odpalać TS bez builda — dla dev OK. Prod Dockerfile (task 045) zbuduje workera AOT.
