---
id: 003
title: Postaw Postgres i Redis przez docker-compose
type: chore
status: done
depends_on: [001]
touches:
  - docker-compose.yml
  - .env.example
  - .gitignore
  - tasks/verify/003.sh
---

## Cel

Uruchomić lokalnie Postgres i Redis przez `docker compose up`, z persistent volumes i healthcheckami. Ten task nie dotyka aplikacji — tylko dependencji infrastrukturalnych, żeby task 004+ mógł zacząć się integrować.

## Kontekst

Na prod Dokploy wystawi nam te same serwisy przez ten sam `docker-compose.yml`. Wersje i konwencje są świadomą decyzją: Postgres 16 (ADR-002), Redis 7 (ADR-003).

## Zakres (DO)

- [ ] Utwórz `docker-compose.yml` z dwoma usługami: `postgres` i `redis`.
- [ ] `postgres`:
  - `image: postgres:16-alpine`
  - env: `POSTGRES_DB=kalendarz`, `POSTGRES_USER=${POSTGRES_USER:-kalendarz}`, `POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD in .env}`
  - volume: `postgres_data:/var/lib/postgresql/data`
  - port: `5432` eksponowany na `127.0.0.1:5432` (tylko localhost)
  - healthcheck: `pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB`, interval 5s, retries 10
  - restart: `unless-stopped`
- [ ] `redis`:
  - `image: redis:7-alpine`
  - command: `redis-server --appendonly yes`
  - volume: `redis_data:/data`
  - port: `6379` na `127.0.0.1:6379`
  - healthcheck: `redis-cli ping | grep PONG`, interval 5s, retries 10
  - restart: `unless-stopped`
- [ ] Zdefiniuj `volumes: postgres_data: {}` i `redis_data: {}`.
- [ ] Utwórz `.env.example` z: `POSTGRES_USER=kalendarz`, `POSTGRES_PASSWORD=change-me-locally`, `DATABASE_URL=postgres://kalendarz:change-me-locally@localhost:5432/kalendarz`, `REDIS_URL=redis://localhost:6379`.
- [ ] Upewnij się, że `.env` jest w `.gitignore` (było dodane w tasku 001, tu tylko weryfikacja).

## Poza zakresem (DON'T)

- Nie dodawaj usługi `app` ani `worker` — osobny task (po instalacji Payload w 004).
- Nie konfiguruj Dokploy-specific compose overrides — osobny task deploymentowy.
- Nie twórz seedów bazy.

## Kryteria akceptacji

- `docker compose config` zwraca exit 0 i pokazuje obie usługi.
- `docker compose up -d postgres redis` startuje oba serwisy i przechodzą do stanu `healthy` w <30 s.
- `psql $DATABASE_URL -c 'SELECT 1'` zwraca `1` (po załadowaniu `.env`).
- `redis-cli -u $REDIS_URL ping` zwraca `PONG`.

## Weryfikacja automatyczna

`tasks/verify/003.sh`:
- sprawdza `docker compose config`
- uruchamia `docker compose up -d postgres redis`
- czeka na healthy (z timeoutem)
- wywołuje psql i redis-cli ping
- na koniec robi `docker compose down` (żeby verify było idempotentne)

## Weryfikacja manualna

- [ ] `docker compose up -d` i w drugim terminalu `docker compose ps` — oba `healthy`.
- [ ] `docker compose logs postgres` — brak `FATAL` w logach.
- [ ] Po `docker compose down && docker compose up -d` — dane przetrwały (sprawdź `psql -c '\l'`).

## Notatki dla agenta

- Bindowanie portów na `127.0.0.1:` jest celowe — nie wystawiaj Postgresa na 0.0.0.0 nawet lokalnie.
- Hasło `change-me-locally` w `.env.example` to placeholder; user skopiuje do `.env` i zmieni.
- Nie używaj `version: "3.x"` w docker-compose.yml — to pole jest deprecated w compose v2.
