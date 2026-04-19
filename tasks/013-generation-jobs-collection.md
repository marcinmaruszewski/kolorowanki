---
id: 013
title: Utwórz kolekcję generationJobs
type: feat
status: done
depends_on: [011]
touches:
  - src/payload/collections/generation-jobs.ts
  - src/payload.config.ts
  - src/payload-types.ts
  - tasks/verify/013.sh
---

## Cel

Kolekcja śledząca joby OpenAI Batch API (FR-4, FR-5) + tracking kosztów (NFR-4) — każdy research/images/pdf ma swój rekord ze `openaiBatchId`, statusem i kosztem.

## Zakres (DO)

- [ ] `src/payload/collections/generation-jobs.ts`:
  - `slug: 'generation-jobs'`
  - pola:
    - `calendar`: relationship → calendars, required
    - `type`: select [`research`, `images`, `single-image`, `pdf`], required
    - `status`: select [`queued`, `submitted`, `in-progress`, `completed`, `failed`, `cancelled`], default `queued`
    - `openaiBatchId`: text, nullable (null dla single-image realtime i pdf)
    - `costUsd`: number, default 0
    - `inputTokens`: number, default 0
    - `outputTokens`: number, default 0
    - `errorLog`: textarea, nullable
    - `startedAt`, `completedAt`: date, nullable
  - `access`: user czyta swoje (przez calendar → owner), admin wszystko; `update`/`create` tylko server-side (przez worker z `overrideAccess: true`); `delete`: admin only

## Poza zakresem (DON'T)

- Nie integruj z workerami (taski 021-023).
- Nie buduj dashboardu kosztów (task 042).

## Kryteria akceptacji

- Kolekcja działa w admin UI (read-only dla non-admin przez UI).
- Server-side `payload.create` tworzy rekord z wymaganymi polami.

## Weryfikacja automatyczna

`tasks/verify/013.sh`: tsc, types, vitest integration.

## Weryfikacja manualna

- [ ] Admin UI → Generation Jobs → widoczna kolekcja z filtrami.

## Notatki dla agenta

- `openaiBatchId` nie jest unique — mogą zdarzyć się retry z innym id.
- Nie stosuj tu relacji do `days`. Jeden `images` batch dotyczy całego kalendarza. Pojedyncze dni odczytujemy przez relację `calendar`.
