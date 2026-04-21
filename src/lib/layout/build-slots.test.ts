import { describe, it, expect } from 'vitest'
import { buildSlots, type Slot } from './build-slots'

const A4_W = 595
const A4_H = 842
const SEED = 42

/** Sprawdza, czy bounding box slotu (bez rotacji) mieści się w stronie. */
function slotFitsInPage(slot: Slot, pageW: number, pageH: number): boolean {
  return (
    slot.x >= 0 &&
    slot.y >= 0 &&
    slot.x + slot.w <= pageW &&
    slot.y + slot.h <= pageH
  )
}

/** Pole przecięcia dwóch prostokątów (AABB, bez rotacji). */
function overlapArea(a: Slot, b: Slot): number {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
  return ix * iy
}

describe('buildSlots', () => {
  it('zwraca dokładnie daysInMonth slotów', () => {
    for (const days of [28, 29, 30, 31]) {
      const slots = buildSlots(days, A4_W, A4_H, SEED)
      expect(slots).toHaveLength(days)
    }
  })

  it('numery dni są unikalne i zaczynają się od 1', () => {
    const slots = buildSlots(31, A4_W, A4_H, SEED)
    const nums = slots.map((s) => s.dayNumber)
    expect(nums).toEqual(Array.from({ length: 31 }, (_, i) => i + 1))
  })

  it('każdy slot mieści się w stronie A4', () => {
    const slots = buildSlots(31, A4_W, A4_H, SEED)
    for (const slot of slots) {
      expect(slotFitsInPage(slot, A4_W, A4_H)).toBe(true)
    }
  })

  it('brak nadmiernych overlapów (> 5% pola mniejszego kafelka)', () => {
    const slots = buildSlots(31, A4_W, A4_H, SEED)
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i]!
        const b = slots[j]!
        const overlap = overlapArea(a, b)
        const smaller = Math.min(a.w * a.h, b.w * b.h)
        expect(overlap / smaller).toBeLessThanOrEqual(0.05)
      }
    }
  })

  it('jest deterministyczny — ten sam seed daje identyczny układ', () => {
    const first = buildSlots(31, A4_W, A4_H, SEED)
    const second = buildSlots(31, A4_W, A4_H, SEED)
    expect(first).toEqual(second)
  })

  it('różne seedy dają różne układy', () => {
    const a = buildSlots(31, A4_W, A4_H, 1)
    const b = buildSlots(31, A4_W, A4_H, 2)
    expect(a).not.toEqual(b)
  })
})
