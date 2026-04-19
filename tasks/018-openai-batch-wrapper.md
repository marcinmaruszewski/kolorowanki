---
id: 018
title: Wrapper OpenAI Batch API (submit + poll + parse)
type: feat
status: pending
depends_on: [015]
touches:
  - src/lib/openai/batch.ts
---

## Cel

Wspólny helper nad OpenAI Batch API (ADR-004) — submit batcha (`/v1/responses` i `/v1/images/generations`), polling statusu, parsowanie wyników.

## Zakres (DO)

- [ ] `src/lib/openai/batch.ts`:
  - `submitBatch(input: { endpoint: '/v1/responses' | '/v1/images/generations'; requests: BatchRequest[] }): Promise<{ batchId: string }>`
    - tworzy JSONL z `custom_id`, `method: "POST"`, `url`, `body` per request
    - uploaduje jako File (`/v1/files` purpose=`batch`)
    - tworzy batch (`/v1/batches`)
    - zwraca `batchId`
  - `getBatchStatus(batchId: string): Promise<{ status: 'validating' | 'in_progress' | 'completed' | 'failed' | 'expired' | 'cancelled'; outputFileId: string | null; errorFileId: string | null }>`
  - `downloadBatchResults(outputFileId: string): Promise<Array<{ custom_id: string; response: unknown }>>` — fetch'uje plik, parsuje JSONL
  - `cancelBatch(batchId)` — do cleanupu

## Poza zakresem (DON'T)

- Nie zakładaj konkretnej struktury `response` — to domena callera (research vs images).
- Nie dodawaj pollingu z retry/backoff tutaj — to robi worker (task 021/022) z BullMQ delayed jobs.

## Kryteria akceptacji

- Wszystkie funkcje typowane.
- Testy jednostkowe z mock'owanym `openai` client'em pokrywają happy path + błędny batch status.

## Weryfikacja automatyczna

`tasks/verify/018.sh`: tsc + vitest (mockowany OpenAI SDK).

## Weryfikacja manualna

- [ ] Opcjonalne: uruchom e2e z prawdziwym kluczem (kosztem ~$0.01) — submit mini batch z 1 requestem `/v1/responses`, poczekaj na completed, download wyników.

## Notatki dla agenta

- Batch API docs: https://platform.openai.com/docs/guides/batch — sprawdź **aktualny** format requestów i limit'y (100k per batch, 200 MB plik).
- `custom_id` to klucz korelacji — dla researchu użyj `research-<calendarId>`, dla obrazków `day-<calendarId>-<day>`.
- Nie korzystaj z `openai.batches.retrieveResults` — nie ma takiej metody, trzeba samemu pobrać plik wyjściowy.
