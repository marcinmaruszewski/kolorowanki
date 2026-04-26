---
id: 046
title: Production Dockerfile dla workera
type: chore
status: done
depends_on: [020, 045]
touches:
  - Dockerfile.worker
  - tasks/verify/046.sh
---

## Cel

Osobny image dla kontenera `worker` (bez Next) — mniejszy, szybszy start.

## Zakres (DO)

- [ ] `Dockerfile.worker`: stage deps (jak w 045) + stage runner kopiujący tylko `src/jobs/**`, `src/payload.config.ts`, `src/collections/**`, `src/lib/**`, i `node_modules`.
- [ ] `CMD ["tsx", "src/jobs/worker-entry.ts"]` (lub pre-build do JS w stage builder).

## Poza zakresem (DON'T)

- Shared build z app — dla MVP OK, że powtarzają się zależności (overhead akceptowalny).

## Kryteria akceptacji

- `docker build -f Dockerfile.worker` kończy się sukcesem.

## Weryfikacja automatyczna

`tasks/verify/046.sh`: build test.

## Weryfikacja manualna

- [ ] `docker run` z ENV → logi „Worker listening on queues: research, images, single-image, pdf".

## Notatki dla agenta

- Jeśli build TS → JS, użyj `tsc --outDir dist` w builderze i `CMD ["node", "dist/jobs/worker-entry.js"]` (szybszy start niż tsx w prod).
