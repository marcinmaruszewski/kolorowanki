---
id: 045
title: Production Dockerfile (multi-stage, next build)
type: chore
status: done
depends_on: [004]
touches:
  - Dockerfile.prod
  - .dockerignore
  - next.config.mjs
  - tasks/verify/045.sh
  - public/.gitkeep
---

## Cel

Multi-stage Dockerfile dla deploy na Dokploy — buduje Next app (standalone output), minimalizuje image.

## Zakres (DO)

- [ ] Stage `deps`: `node:20-alpine`, `pnpm install --frozen-lockfile`.
- [ ] Stage `builder`: kopiuje src + deps, `pnpm payload generate:types` + `pnpm next build` (output: `standalone`).
- [ ] Stage `runner`: `node:20-alpine`, user `node`, kopiuje `.next/standalone` + `.next/static` + `public` + `media` (pusty) + `node_modules`.
- [ ] `CMD ["node", "server.js"]` (z standalone).
- [ ] `EXPOSE 3000`.

## Poza zakresem (DON'T)

- Image dla workera — osobny task (046).
- next.config.js `output: 'standalone'` — zadbaj w ramach 005.

## Kryteria akceptacji

- `docker build -f Dockerfile.prod -t kolorowanki:test .` kończy się sukcesem.
- Image < 400 MB.

## Weryfikacja automatyczna

`tasks/verify/045.sh`: `docker build --dry-run` + `docker image inspect` size check.

## Weryfikacja manualna

- [ ] `docker run` z ENV, curl localhost:3000 → 200.

## Notatki dla agenta

- `.dockerignore`: `node_modules`, `.next`, `.git`, `media`, `*.log`.
- Jeśli `output: 'standalone'` nie jest jeszcze ustawione — dodaj w ramach tego tasku.
