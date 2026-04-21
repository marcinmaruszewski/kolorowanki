---
id: 035
title: Strona edytora fabric.js (A4 canvas + załadowanie obrazków)
type: feat
status: done
depends_on: [031, 034]
touches:
  - src/app/(app)/kalendarz/[id]/edytor/page.tsx
  - src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx
  - package.json
  - tasks/verify/035.sh
---

## Cel

`/kalendarz/[id]/edytor` — canvas fabric.js w proporcjach A4 (portrait), auto-wypełnienie `buildSlots(daysInMonth)`, załadowanie obrazków dni jako `fabric.Image` w odpowiednie sloty.

## Zakres (DO)

- [ ] `pnpm add fabric` (zapisz w 002 — lub dodaj teraz w 035 touches: package.json).
- [ ] `FabricCanvas` (`use client`): `new fabric.Canvas('c', { width, height })`, wczytaj sloty z `buildSlots`, dla każdego slotu załaduj `fabric.Image.fromURL(day.media.url, img => canvas.add(img))` — scale do `slot.w/h`, rotate `slot.rotationDeg`, position `slot.x, slot.y`.
- [ ] Canvas zoom-to-fit viewport.

## Poza zakresem (DON'T)

- Drag/rotate interakcje — task 036.
- Zapis stanu — task 037.

## Kryteria akceptacji

- Otwarcie edytora → widać 28-31 obrazków w układzie mozaiki.
- Brak błędów w konsoli.

## Weryfikacja automatyczna

`tasks/verify/035.sh`: Playwright — otwórz edytor, assert canvas istnieje, assert count obiektów >= daysInMonth.

## Weryfikacja manualna

- [ ] Wizualnie: układ przypomina ten z `compose_month_pdf.py` (referencyjny PDF w skill folderze).

## Notatki dla agenta

- fabric v6+ ma ESM imports: `import { Canvas, FabricImage } from 'fabric'`.
- `crossOrigin: 'anonymous'` na FabricImage, żeby PNG z naszego endpointu działał.
