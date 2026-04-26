---
id: 047
title: docker-compose.prod.yml dla Dokploy
type: chore
status: done
depends_on: [045, 046]
touches:
  - docker-compose.prod.yml
  - .env.production.example
  - tasks/verify/047.sh
---

## Cel

Compose file używany przez Dokploy — produkcyjne images z Dockerfile.prod i Dockerfile.worker, volumes dla postgres-data i media, restart policy.

## Zakres (DO)

- [ ] Services: `postgres`, `redis`, `app` (Dockerfile.prod), `worker` (Dockerfile.worker).
- [ ] `app` — mapowanie portu 3000, env z `.env.production`.
- [ ] Dokploy-friendly: brak `build:` (Dokploy buduje z repo) — zamiast tego `image: ${DOCKER_REGISTRY}/kolorowanki-app:${TAG}` — albo `build: context: . dockerfile: Dockerfile.prod` (Dokploy supportuje build).
- [ ] Named volumes: `postgres-data`, `media`.
- [ ] `restart: unless-stopped`.
- [ ] `.env.production.example` — lista ENV bez wartości.

## Poza zakresem (DON'T)

- SSL / reverse proxy — Dokploy/Traefik zajmuje się tym.

## Kryteria akceptacji

- `docker compose -f docker-compose.prod.yml config` waliduje się bez błędów.

## Weryfikacja automatyczna

`tasks/verify/047.sh`: `docker compose config` check.

## Weryfikacja manualna

- [ ] Marcin skonfiguruje Dokploy stack z tego compose.

## Notatki dla agenta

- Dokploy wymaga określonej struktury, sprawdź docs dokploy.com.
- Env nie commituj — tylko `.env.production.example`.
