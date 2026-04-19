---
id: 029
title: Edycja planu (okazja, motyw) przed generacją obrazków
type: feat
status: pending
depends_on: [028]
touches:
  - src/app/(app)/kalendarz/[id]/plan/plan-table.tsx
  - src/app/(app)/kalendarz/[id]/plan/actions.ts
---

## Cel

Pozwól userowi zmienić `occasion` i `motif` per day przed kliknięciem „Wygeneruj obrazki" (FR-4). Po zapisie — dni aktualizowane w DB.

## Zakres (DO)

- [ ] `PlanTable` — każdy wiersz ma inputy (okazja, motif) sterowane stanem; przycisk „Zapisz zmiany" (disabled gdy nic się nie zmieniło).
- [ ] Server Action `updateDays(calendarId, updates: Array<{id, occasion, motif}>)`:
  - auth check: owner == current user (lub admin)
  - guard: `calendar.status === 'draft'` (jeśli `generated` → 409, nie pozwalaj)
  - batch update przez `payload.update` per row
- [ ] Walidacja: motif 10-300 znaków, occasion 0-200.

## Poza zakresem (DON'T)

- Edytowanie obrazków — task 033.

## Kryteria akceptacji

- Zapis idzie, wartości się aktualizują.
- Dla `status='generated'` — zapis blokowany.

## Weryfikacja automatyczna

`tasks/verify/029.sh`: vitest na Server Action (guard + update).

## Weryfikacja manualna

- [ ] Edytuj motyw dnia, zapisz, odśwież stronę → widzisz nową wartość.

## Notatki dla agenta

- `use client` dla PlanTable (potrzebuje stanu).
- Optymistyczny update w UI — po zapisie revalidatePath aktualnej ścieżki.
