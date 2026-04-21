/**
 * Port algorytmu build_slots() z compose_month_pdf.py.
 * Generuje listę slotów dla organicznej mozaiki A4.
 * Jednostki: punkty PDF (1 pt = 1/72 cala).
 */

export interface Slot {
  /** Lewy górny róg — oś X w punktach */
  x: number;
  /** Lewy górny róg — oś Y w punktach */
  y: number;
  /** Szerokość slotu w punktach */
  w: number;
  /** Wysokość slotu w punktach */
  h: number;
  /** Obrót w stopniach (dodatni = zgodnie z ruchem wskazówek zegara) */
  rotationDeg: number;
  /** Numer dnia miesiąca (1-based) */
  dayNumber: number;
}

/**
 * Mulberry32 — deterministyczny PRNG z seedem 32-bitowym.
 * Zwraca float w [0, 1).
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Domyślny seed — może być nadpisany przez parametr seed */
const DEFAULT_SEED = 2718281828;

/** Liczba kolumn w siatce bazowej */
const COLS = 5;

/** Margines strony [pt] */
const MARGIN = 20;

/** Odstęp między kafelkami [pt] */
const GAP = 8;

/** Zakres organicznego przesunięcia jako ułamek rozmiaru komórki */
const OFFSET_FRAC = 0.02;

/** Zakres organicznego obrotu [stopnie] (symetrycznie ±) */
const ROTATION_MAX = 4.5;

/** Zakres losowej zmiany rozmiaru kafelka (symetrycznie ±) */
const SIZE_VAR_FRAC = 0.01;

/**
 * Generuje listę slotów dla organicznej mozaiki A4.
 *
 * @param daysInMonth  Liczba dni w miesiącu (28–31)
 * @param pageWidth    Szerokość strony [pt], np. 595 dla A4
 * @param pageHeight   Wysokość strony [pt], np. 842 dla A4
 * @param seed         Opcjonalny seed dla PRNG — determinizm
 */
export function buildSlots(
  daysInMonth: number,
  pageWidth: number,
  pageHeight: number,
  seed?: number,
): Slot[] {
  const rng = mulberry32(seed ?? DEFAULT_SEED);

  const rows = Math.ceil(daysInMonth / COLS);

  const availW = pageWidth - 2 * MARGIN;
  const availH = pageHeight - 2 * MARGIN;

  const cellW = (availW - (COLS - 1) * GAP) / COLS;
  const cellH = (availH - (rows - 1) * GAP) / rows;

  const slots: Slot[] = [];

  for (let i = 0; i < daysInMonth; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    const baseX = MARGIN + col * (cellW + GAP);
    const baseY = MARGIN + row * (cellH + GAP);

    const offsetX = (rng() - 0.5) * 2 * OFFSET_FRAC * cellW;
    const offsetY = (rng() - 0.5) * 2 * OFFSET_FRAC * cellH;
    const rotationDeg = (rng() - 0.5) * 2 * ROTATION_MAX;
    const sizeVar = 1 + (rng() - 0.5) * 2 * SIZE_VAR_FRAC;

    slots.push({
      x: baseX + offsetX,
      y: baseY + offsetY,
      w: cellW * sizeVar,
      h: cellH * sizeVar,
      rotationDeg,
      dayNumber: i + 1,
    });
  }

  return slots;
}
