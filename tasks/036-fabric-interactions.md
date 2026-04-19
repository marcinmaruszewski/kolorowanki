---
id: 036
title: Interakcje fabric.js — drag, rotate, scale, duplicate, delete
type: feat
status: pending
depends_on: [035]
touches:
  - src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx
  - src/app/(app)/kalendarz/[id]/edytor/toolbar.tsx
---

## Cel

User może klikać obrazek, przesuwać, skalować (rogami), obracać (łącznik nad obiektem). Toolbar: „Shuffle" (losowy układ), „Reset" (powrót do `buildSlots`), „Undo/Redo" (historia lokalna).

## Zakres (DO)

- [ ] Włącz standardowe fabric controls (`selectable: true, hasControls: true`).
- [ ] Snap na siatkę co 10 pt (opcjonalnie).
- [ ] Toolbar nad canvas: Shuffle → `buildSlots(daysInMonth, seed=Date.now())` + re-apply. Reset → `buildSlots(daysInMonth, seed=calendarId.hash)` (stabilny seed per kalendarz).
- [ ] Undo/Redo: prosty stack JSON-serializowany co akcję (max 20 kroków).

## Poza zakresem (DON'T)

- Zapis do DB — task 037.
- Eksport — task 038.

## Kryteria akceptacji

- User może ruszyć obiekt myszą.
- Shuffle → nowy układ.
- Undo/Redo działa.

## Weryfikacja automatyczna

`tasks/verify/036.sh`: Playwright — drag, assert nowa pozycja.

## Weryfikacja manualna

- [ ] Przesuń, obróć, zeskaluj, zrób shuffle, reset.

## Notatki dla agenta

- Hash calendarId → `crypto.createHash('sha1').update(id).digest()` → liczba.
- Undo stack: `canvas.toJSON()` / `canvas.loadFromJSON()`.
