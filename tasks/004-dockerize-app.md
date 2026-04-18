---
id: 004
title: Skonteneryzuj aplikację (Dockerfile + usługa app w compose)
type: chore
status: pending
depends_on: [002, 003]
touches:
  - Dockerfile
  - .dockerignore
  - docker-compose.yml
  - .env.example
---

## Cel

Dodać Dockerfile dla aplikacji i usługę `app` do `docker-compose.yml`, żeby od tego momentu każda komenda Node (`pnpm`, `vitest`, `tsc`, `next`) odpalała się **w kontenerze**, nigdy na hoście. Na tym etapie kontener startuje bez `pnpm dev`, bo Next.js jeszcze nie jest zainstalowany — służy jako baza, w której task 005 odpali `pnpm install`.

## Kontekst

ADR-001/002/003 + wybór ścieżki Docker-first (2026-04-18, ustalone z userem). Bind mount całego repo do `/app` daje IDE host'owy dostęp do `node_modules` utworzonego w kontenerze (WSL2 + Linux kontener = brak problemów z natywnymi modułami typu `sharp`).

## Zakres (DO)

- [ ] Utwórz `Dockerfile` z jednym stage'em dev, opartym na `node:22-alpine`:
  - `RUN corepack enable` (pnpm dostępne z `packageManager` z `package.json`)
  - `WORKDIR /app`
  - `ENV NODE_ENV=development`
  - `ENV PNPM_HOME=/app/.pnpm-store` (cache wewnątrz mount'a)
  - domyślny `CMD ["tail", "-f", "/dev/null"]` — kontener utrzymuje się przy życiu, `pnpm dev` wchodzi w task 005
  - (prod target dokładamy w osobnym tasku deploymentowym — tu tylko dev)
- [ ] Utwórz `.dockerignore` zawierający: `node_modules`, `.next`, `.git`, `.env`, `.env.local`, `*.log`, `coverage`, `playwright-report`, `test-results`, `.DS_Store`.
- [ ] Rozszerz `docker-compose.yml` o usługę `app`:
  - `build: { context: ., dockerfile: Dockerfile }`
  - `working_dir: /app`
  - `volumes: - .:/app:cached` (bind mount całego repo, **bez** named volume na `node_modules` — na Linuxie bind wystarcza)
  - `ports: - "127.0.0.1:3000:3000"`
  - `env_file: .env`
  - `depends_on: postgres: { condition: service_healthy }, redis: { condition: service_healthy }`
  - `restart: unless-stopped`
  - **brak** `command:` (CMD z Dockerfile zachowa kontener przy życiu)
- [ ] W `.env.example` dodaj: `NODE_ENV=development`, `NEXT_PUBLIC_SERVER_URL=http://localhost:3000`, `PAYLOAD_SECRET=change-me-in-env`.
- [ ] Zaktualizuj `DATABASE_URL` i `REDIS_URL` w `.env.example`, żeby używały nazw usług compose zamiast `localhost`:
  - `DATABASE_URL=postgres://kalendarz:change-me-locally@postgres:5432/kalendarz`
  - `REDIS_URL=redis://redis:6379`
  - (kontener `app` łączy się po nazwie usługi w sieci compose)

## Poza zakresem (DON'T)

- Nie instaluj żadnych pakietów przez `pnpm add` (to task 005).
- Nie twórz prod stage'a Dockerfile'a — to w osobnym tasku przed deployem.
- Nie modyfikuj healthchecków `postgres`/`redis` z taska 003.
- Nie konfiguruj worker'a BullMQ jako osobnej usługi — to osobny task po instalacji kolejki.

## Kryteria akceptacji

- `docker compose config` zwraca exit 0 i pokazuje trzy usługi: `postgres`, `redis`, `app`.
- `docker compose build app` kończy się sukcesem.
- `docker compose up -d` startuje wszystkie trzy usługi; `app` jest w stanie `running` (nie ma healthcheck'a bo jeszcze nic nie serwuje).
- `docker compose exec app pnpm -v` zwraca wersję zgodną z `packageManager` z `package.json`.
- `docker compose exec app node -v` zwraca `v22.x`.
- `docker compose exec app sh -c 'cat /app/package.json | head -1'` pokazuje bind mount działa (host i kontener widzą te same pliki).

## Weryfikacja automatyczna

`tasks/verify/004.sh`:
- `docker compose config` → exit 0
- `docker compose build app` → exit 0
- `docker compose up -d` → wait, then check `app` running, `pnpm -v` w kontenerze, `node -v` w kontenerze
- `docker compose exec app sh -c 'echo OK'` → `OK`
- na koniec `docker compose down` (idempotencja)

## Weryfikacja manualna

- [ ] `docker compose up -d` i w innym terminalu `docker compose ps` — wszystkie trzy usługi `running`, postgres i redis `healthy`.
- [ ] `docker compose exec app pnpm -v` i `docker compose exec app node -v` zwracają oczekiwane wersje.
- [ ] Utwórz plik `test.txt` w repo na hoście, sprawdź `docker compose exec app cat /app/test.txt` — plik widoczny. Usuń.

## Notatki dla agenta

- Na Linuxie (WSL2) bind mount nie powoduje problemów z `sharp`/`bcrypt` — host i kontener to ten sam ABI. NIE dodawaj named volume na `node_modules` — to blokuje widoczność modułów dla IDE.
- `--frozen-lockfile` nie może być teraz użyty, bo `pnpm-lock.yaml` nie istnieje. Będzie użyty w prod buildzie w osobnym tasku.
- `PNPM_HOME=/app/.pnpm-store` pozwala uniknąć problemów z uprawnieniami do globalnego cache'u pnpm w kontenerze. Dopisz `.pnpm-store/` do `.gitignore` w tym tasku (UWAGA: to jedna linijka, dopisz do istniejącego `.gitignore` z tasku 001 — to mieści się w `touches` poprzez `.env.example`? NIE. Dopisz `.gitignore` do `touches` tego taska jeśli dopisujesz do niego linijkę).
- Jeśli `docker compose build` wychodzi wolno w Twoim setupie — sprawdź czy BuildKit jest włączony (`DOCKER_BUILDKIT=1`, w Dockerze 23+ domyślnie tak).
