---
id: 023
title: Worker regeneracji pojedynczego dnia (realtime, bez batch)
type: feat
status: pending
depends_on: [022]
touches:
  - src/jobs/single-image-worker.ts
  - src/jobs/worker-entry.ts
---

## Cel

Worker dla kolejki `single-image` regenerujący jeden `day` przez realtime `/v1/images/generations` (FR-6 — bez batch, dla szybkości UX).

## Zakres (DO)

- [ ] `src/jobs/single-image-worker.ts`:
  - jobPayload: `{ dayId: string, newPrompt?: string }`
  - ładuje day, buduje prompt (z `newPrompt` jeśli podany, inaczej z `day.motif`)
  - `openai.images.generate({ model: IMAGE_MODEL, prompt, size: '1024x1024' })` — bez batch
  - zapisuje nowy PNG do media, replace `day.image` (stary media record → delete, żeby volume nie rósł)
  - aktualizuje `day.prompt`, `day.status='generated'`
  - tracking: tworzy `generationJob` z `type='single-image'`
  - limit per kalendarz: sprawdź ile `generationJob` z `type='single-image'` dla tego kalendarza istnieje — jeśli >=20 (FR-6.4), rzuć błąd

## Poza zakresem (DON'T)

- Nie implementuj UI do regeneracji (task 032).

## Kryteria akceptacji

- Job kończy się w <30 s przy sprawnym OpenAI.
- Stary media record jest usuwany.
- Po 20 regeneracjach kolejna → job failed z sensownym `errorLog`.

## Weryfikacja automatyczna

`tasks/verify/023.sh`: vitest z mockiem `openai.images.generate`.

## Weryfikacja manualna

- [ ] Wyślij job dla istniejącego day → nowy PNG w media, day.prompt zaktualizowany.
- [ ] Powtórz 21x → 21-szy fail.

## Notatki dla agenta

- `openai.images.generate` zwraca `b64_json` lub `url` (zależnie od `response_format`). Default w gpt-image-1.5 to `b64_json`.
- Delete starego media: `payload.delete({ collection: 'media', id: oldMediaId })` — Payload sam zdejmie plik z filesystemu.
