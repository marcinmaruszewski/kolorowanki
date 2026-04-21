---
id: 032
title: Modal regeneracji pojedynczego dnia (prompt override)
type: feat
status: done
depends_on: [023, 031]
touches:
  - src/app/(app)/kalendarz/[id]/obrazki/regenerate-modal.tsx
  - src/app/(app)/kalendarz/[id]/obrazki/actions.ts
  - src/app/(app)/kalendarz/[id]/obrazki/day-tile.tsx
  - src/styles/globals.css
  - tasks/verify/032.sh
  - tests/task-032/regenerate-day.test.ts
---

## Cel

Klik „Regeneruj" na kafelce → modal z podglądem aktualnego obrazka + textarea z obecnym `day.prompt` (edytowalny) + przycisk „Wygeneruj od nowa". Server Action enqueuje job do kolejki `single-image`, modal pokazuje spinner + polling co 3 s.

## Zakres (DO)

- [ ] `regenerate-modal.tsx` (`use client`): dialog z aktualnym obrazkiem, textarea na prompt (prefill `day.prompt`), submit.
- [ ] Server Action `regenerateDay(dayId, newPrompt?)`:
  - auth check
  - sprawdź licznik regeneracji na tym kalendarzu (`generationJobs` `type='single-image'`, status != 'failed') — jeśli >=20, błąd „Wykorzystałeś limit 20 regeneracji na ten kalendarz."
  - enqueue do BullMQ `single-image` z `{dayId, newPrompt}`
  - zwróć `{ jobId }`
- [ ] Polling (client): fetch `GET /api/generation-jobs/[id]` co 3 s → gdy `status='completed'` zamknij modal, revalidate galerię.

## Poza zakresem (DON'T)

- Batch update planu — task 029.

## Kryteria akceptacji

- Modal się otwiera, textarea prefillowana, submit działa.
- Po 20 udanych regeneracjach kolejna → błąd w modalu.
- Po wygenerowaniu — nowy obrazek widoczny po auto-odświeżeniu.

## Weryfikacja automatyczna

`tasks/verify/032.sh`: Playwright + mock OpenAI w workerze.

## Weryfikacja manualna

- [ ] Zmień prompt, regeneruj, zobacz nowy obrazek.

## Notatki dla agenta

- `GET /api/generation-jobs/[id]` — Payload REST auto-endpoint (auth: user must be owner lub admin).
- Spinner: prosta animacja CSS.
