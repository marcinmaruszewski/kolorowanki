---
id: 019
title: Skonfiguruj BullMQ + Redis connection
type: feat
status: done
depends_on: [003, 005]
touches:
  - package.json
  - pnpm-lock.yaml
  - src/lib/queue/connection.ts
  - src/lib/queue/queues.ts
  - src/lib/queue/__tests__/connection.test.ts
  - tasks/verify/019.sh
---

## Cel

Zainstalować BullMQ (ADR-003) i zdefiniować szkielet kolejek: połączenie do Redisa + cztery queue'sy (`research`, `images`, `single-image`, `pdf`).

## Zakres (DO)

- [ ] `docker compose run --rm app pnpm add bullmq ioredis`
- [ ] `src/lib/queue/connection.ts`:
  ```ts
  import { Redis } from 'ioredis'
  export const redisConnection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
  ```
- [ ] `src/lib/queue/queues.ts`:
  - `researchQueue = new Queue('research', { connection: redisConnection })`
  - `imagesQueue = new Queue('images', …)`
  - `singleImageQueue = new Queue('single-image', …)`
  - `pdfQueue = new Queue('pdf', …)`
  - export pomocnika `enqueueResearch(calendarId: string)` itd. — cieńkie wrappery

## Poza zakresem (DON'T)

- Nie twórz workerów (taski 021-023).
- Nie mountuj BullBoard (task 043).

## Kryteria akceptacji

- Import queues'ów kompiluje się.
- `redisConnection.ping()` zwraca `PONG` (test integracyjny z żywym Redisem z compose).

## Weryfikacja automatyczna

`tasks/verify/019.sh`: tsc + vitest integration (używa Redisa z compose).

## Weryfikacja manualna

- [ ] `docker compose exec app node -e "import('./src/lib/queue/connection.ts').then(m => m.redisConnection.ping().then(console.log))"` → `PONG`.

## Notatki dla agenta

- `maxRetriesPerRequest: null` jest wymogiem BullMQ przy ioredis — inaczej workery się wysypują.
- Nie używaj `legacyRateLimiter` — BullMQ v5+ ma to wbudowane.
