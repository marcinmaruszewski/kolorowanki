---
id: 034
title: Port algorytmu build_slots() z Pythona do TypeScript
type: feat
status: done
depends_on: [002]
touches:
  - src/lib/layout/build-slots.ts
  - src/lib/layout/build-slots.test.ts
  - tasks/verify/034.sh
---

## Cel

Przepisz funkcję `build_slots()` z `.agents/skills/miesieczny-kalendarz-kolorowanek/compose_month_pdf.py` do TypeScript. Zwraca listę slotów `{x, y, w, h, rotationDeg, dayNumber}` dla danego miesiąca/roku, układ „organiczna mozaika" A4.

## Zakres (DO)

- [ ] Przeczytaj `compose_month_pdf.py` (sekcja `build_slots`) i wiernie przepisz.
- [ ] Parametry: `daysInMonth: number`, `pageWidth: number`, `pageHeight: number`, `seed?: number`.
- [ ] Deterministyczny RNG (seeded) — `mulberry32` lub `seedrandom` npm.
- [ ] Unit testy: `daysInMonth=31`, sprawdź że każdy slot mieści się w A4, brak overlapów > 5% (tolerancja jak w oryginale).

## Poza zakresem (DON'T)

- Integracja z fabric.js — task 036.
- Renderowanie PDF — task 039.

## Kryteria akceptacji

- Deterministyczność: ten sam seed → identyczny układ.
- Liczba slotów = `daysInMonth`.

## Weryfikacja automatyczna

`tasks/verify/034.sh`: `pnpm vitest run build-slots`.

## Weryfikacja manualna

- [ ] `console.log(buildSlots(31, 595, 842, 42))` w REPL.

## Notatki dla agenta

- A4 w punktach PDF: 595 × 842 (72 DPI) — ale fabric.js używa pikseli; ustal 1 jednostkę = 1 punkt PDF (1 pt = 1.333 px w 96 DPI).
- Zwróć rozmiary w punktach, konwersja w fabric-init.
