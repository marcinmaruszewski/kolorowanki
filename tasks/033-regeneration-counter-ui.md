---
id: 033
title: Licznik pozostałych regeneracji i ostrzeżenia
type: feat
status: done
depends_on: [032]
touches:
  - src/app/(app)/kalendarz/[id]/obrazki/page.tsx
  - src/app/(app)/kalendarz/[id]/obrazki/regenerate-counter.tsx
  - src/app/(app)/kalendarz/[id]/obrazki/day-tile.tsx
  - src/lib/quota/regenerations.ts
  - src/styles/globals.css
  - tasks/verify/033.sh
  - tests/task-033/regeneration-counter.test.ts
---

## Cel

Widoczny licznik „Regeneracji zostało: X/20" nad galerią. Jeśli 0 → przyciski „Regeneruj" disabled.

## Zakres (DO)

- [ ] W `page.tsx` policz `used = count(generationJobs where calendar=X and type='single-image' and status != 'failed')`.
- [ ] `RegenerateCounter` renderuje „Zostało N regeneracji z 20".
- [ ] Przekaż `disabled={used >= 20}` do każdego `DayTile`.

## Poza zakresem (DON'T)

- Liczenie dla adminów (admin ma unlimited — zapisz w komentarzu dla przyszłości, nie implementuj).

## Kryteria akceptacji

- 20 regeneracji → licznik 0, wszystkie „Regeneruj" disabled.

## Weryfikacja automatyczna

`tasks/verify/033.sh`: vitest na helper liczący.

## Weryfikacja manualna

- [ ] Seed: calendar z 20 generationJobs single-image — zobacz counter 0.

## Notatki dla agenta

- Trzymaj count logic w helperze `countRegenerationsUsed(calendarId)` w `src/lib/quota/regenerations.ts`.
