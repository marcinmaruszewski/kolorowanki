---
id: 005
title: Zainstaluj Payload v3 + Next.js w kontenerze
type: feat
status: pending
depends_on: [004]
touches:
  - package.json
  - pnpm-lock.yaml
  - next.config.mjs
  - tsconfig.json
  - docker-compose.yml
  - src/app/(payload)/layout.tsx
  - src/app/(payload)/admin/[[...segments]]/page.tsx
  - src/app/(payload)/admin/[[...segments]]/not-found.tsx
  - src/app/(payload)/api/[...slug]/route.ts
  - src/app/(payload)/api/graphql/route.ts
  - src/payload.config.ts
  - src/payload-types.ts
---

## Cel

Zainstalować Payload v3 + Next.js App Router w kontenerze `app` (wszystko przez `docker compose run`). Po tym tasku `docker compose up` wystawi Payload Admin UI na `http://localhost:3000/admin`.

## Kontekst

ADR-001: Payload v3 + Next.js App Router, jedno repo. Bazujemy na oficjalnym templacie „blank" z payloadcms/payload, ale dopasowanym do naszej struktury (`src/`, env z compose z taska 004).

## Zakres (DO)

- [ ] W kontenerze zainstaluj dependencje runtime'owe:
  ```bash
  docker compose run --rm app pnpm add \
    next@^15 react@^18 react-dom@^18 \
    payload@^3 @payloadcms/next @payloadcms/richtext-lexical \
    @payloadcms/db-postgres sharp
  ```
- [ ] W kontenerze zainstaluj dev deps:
  ```bash
  docker compose run --rm app pnpm add -D \
    typescript @types/node @types/react @types/react-dom
  ```
- [ ] Utwórz `next.config.mjs`:
  ```js
  import { withPayload } from '@payloadcms/next/withPayload'
  export default withPayload({ reactStrictMode: true })
  ```
- [ ] Utwórz `src/payload.config.ts`:
  - `secret: process.env.PAYLOAD_SECRET`
  - `db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } })`
  - `admin: { user: 'users' }`
  - `collections: []`
  - `editor: lexicalEditor({})`
  - `typescript: { outputFile: path.resolve(__dirname, 'payload-types.ts') }`
- [ ] Utwórz strukturę Next.js App Router dla Payload (skopiuj ze template'u `blank` Payloada):
  - `src/app/(payload)/layout.tsx`
  - `src/app/(payload)/admin/[[...segments]]/page.tsx`
  - `src/app/(payload)/admin/[[...segments]]/not-found.tsx`
  - `src/app/(payload)/api/[...slug]/route.ts`
  - `src/app/(payload)/api/graphql/route.ts`
- [ ] W `tsconfig.json` dodaj:
  ```json
  "paths": { "@payload-config": ["./src/payload.config.ts"] }
  ```
- [ ] W `package.json` dodaj scripts:
  ```json
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "generate:types": "payload generate:types"
  ```
- [ ] W `docker-compose.yml` dla usługi `app` dodaj `command: ["pnpm", "dev"]` (zastępuje CMD z Dockerfile'a, który był `tail -f /dev/null`).

## Poza zakresem (DON'T)

- Nie twórz żadnej kolekcji aplikacyjnej (`users`/`calendars`/`days` to osobne taski).
- Nie konfiguruj Google OAuth.
- Nie pisz frontu aplikacyjnego poza Payload `/admin`.
- Nie zmieniaj Dockerfile'a (pozostaje z taska 004).

## Kryteria akceptacji

- `pnpm-lock.yaml` istnieje w roocie repo (na hoście, przez bind mount z taska 004).
- `docker compose run --rm app pnpm exec tsc --noEmit` bez błędów.
- `docker compose up -d` startuje trzy usługi, `app` po ~10 s odpowiada na `curl http://localhost:3000` (może być 404 Next — ważne, że serwer żyje).
- `curl -I http://localhost:3000/admin` zwraca 200 lub 3xx.
- Utworzenie pierwszego admina przez `/admin` zapisuje rekord w Postgresie: `docker compose exec postgres psql -U kalendarz -d kalendarz -c "SELECT email FROM users"` pokazuje usera.

## Weryfikacja automatyczna

`tasks/verify/005.sh`:
- sprawdza obecność plików
- `docker compose run --rm app pnpm exec tsc --noEmit`
- startuje stack, `curl -I http://localhost:3000/admin` — expect 2xx/3xx
- na koniec `docker compose down`

## Weryfikacja manualna

- [ ] `docker compose up -d && docker compose logs -f app` — brak błędów krytycznych.
- [ ] Otwórz `http://localhost:3000/admin` — widok „Create First User".
- [ ] Utwórz admina (email + hasło), zaloguj się, zobacz pustą listę kolekcji.
- [ ] `docker compose exec postgres psql -U kalendarz -d kalendarz -c '\dt'` pokazuje tabele Payloada (`users`, `payload_preferences`, …).

## Notatki dla agenta

- Payload v3, **nie** v2. Ignoruj tutoriale, gdzie jest `express`.
- `src/app/(payload)` z parenthesem to group route Next.js — izoluje Payloadowe layouty od aplikacyjnego UI, który powstanie pod `src/app/(app)/…`.
- `sharp` potrzebuje natywnych binariów — na `node:22-alpine` instaluje się bez problemu. Jeśli wyskoczą błędy: `docker compose run --rm app pnpm rebuild sharp`.
- `@payloadcms/db-sqlite` **nie** — ADR-002 mówi Postgres w obu środowiskach.
- Pierwsze `pnpm install` w kontenerze trwa kilka minut. To normalne.
