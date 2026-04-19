---
id: 015
title: Skonfiguruj klienta OpenAI i env vars
type: feat
status: done
depends_on: [005]
touches:
  - package.json
  - pnpm-lock.yaml
  - src/lib/openai/client.ts
  - .env.example
  - tasks/verify/015.sh
---

## Cel

Instalacja `openai` SDK i wspólnego singletonu klienta z env vars dla modeli (ADR-005).

## Zakres (DO)

- [ ] `docker compose run --rm app pnpm add openai`
- [ ] `src/lib/openai/client.ts`:
  ```ts
  import OpenAI from 'openai'
  export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  export const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4'
  export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1.5'
  ```
- [ ] `.env.example`:
  ```
  OPENAI_API_KEY=
  OPENAI_TEXT_MODEL=gpt-5.4
  OPENAI_IMAGE_MODEL=gpt-image-1.5
  ```

## Poza zakresem (DON'T)

- Nie implementuj wywołań (taski 016, 017, 018).

## Kryteria akceptacji

- `openai` w package.json.
- `client.ts` eksportuje `openai`, `TEXT_MODEL`, `IMAGE_MODEL`.

## Weryfikacja automatyczna

`tasks/verify/015.sh`: tsc.

## Weryfikacja manualna

- [ ] `docker compose run --rm app node -e "import('./src/lib/openai/client.ts').then(m => console.log(m.TEXT_MODEL))"` → `gpt-5.4`.

## Notatki dla agenta

- Sprawdź najnowszą wersję `openai` SDK. Typy Batch API ewoluowały — docsy na platform.openai.com/docs są aktualnym źródłem.
- `OPENAI_API_KEY` **nie** commituj do `.env.example` z wartością — pusty string.
