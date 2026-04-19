import { describe, it, expect } from 'vitest'
import { buildResearchPrompt, parseMonthPlan } from '../research'
import { MonthPlanSchema } from '../schemas/month-plan'
import { z } from 'zod'

describe('buildResearchPrompt', () => {
  it('zawiera nazwę miesiąca i rok dla 2026/5', () => {
    const prompt = buildResearchPrompt(2026, 5)
    expect(prompt).toContain('Maj 2026')
    expect(prompt).toContain('2026')
    expect(prompt).toContain('5')
  })

  it('jest po polsku i zawiera instrukcję structured output', () => {
    const prompt = buildResearchPrompt(2026, 5)
    expect(prompt).toMatch(/po polsku|polski|JSON|schemat/i)
    expect(prompt).toContain('JSON')
  })

  it('wymaga weryfikacji online', () => {
    const prompt = buildResearchPrompt(2026, 5)
    expect(prompt).toMatch(/online|weryfik/i)
  })

  it('zawiera wymagania dotyczące świąt ustawowych', () => {
    const prompt = buildResearchPrompt(2026, 5)
    expect(prompt).toMatch(/ustawow|pańswtow|gov\.pl/i)
  })

  it('zawiera wymagania dotyczące uroczystości katolickich', () => {
    const prompt = buildResearchPrompt(2026, 5)
    expect(prompt).toMatch(/katolickich|liturgi/i)
  })

  it('zawiera wymagania dotyczące okazji sezonowych', () => {
    const prompt = buildResearchPrompt(2026, 5)
    expect(prompt).toMatch(/sezonow/i)
  })

  it('wymienia pola wynikowego JSON', () => {
    const prompt = buildResearchPrompt(2026, 5)
    expect(prompt).toContain('daysInMonth')
    expect(prompt).toContain('occasion')
    expect(prompt).toContain('motif')
    expect(prompt).toContain('sources')
    expect(prompt).toContain('seriesNotes')
  })

  it('snapshot dla 2026/5', () => {
    const prompt = buildResearchPrompt(2026, 5)
    expect(prompt).toMatchSnapshot()
  })
})

describe('parseMonthPlan', () => {
  const validPlan = {
    year: 2026,
    month: 5,
    daysInMonth: 31,
    days: Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      weekday: 'pon' as const,
      occasion: i === 0 ? 'Święto Pracy' : null,
      motif: 'kwiat',
      sources: i === 0 ? ['https://gov.pl/swieta'] : [],
    })),
    seriesNotes: 'Wiosenny klimat, zielone motywy.',
  }

  it('parsuje poprawny plan', () => {
    const result = parseMonthPlan(validPlan)
    expect(result.year).toBe(2026)
    expect(result.month).toBe(5)
    expect(result.days).toHaveLength(31)
  })

  it('rzuca błąd przy brakującym polu year', () => {
    const { year: _year, ...withoutYear } = validPlan
    expect(() => parseMonthPlan(withoutYear)).toThrow(/year/)
  })

  it('rzuca błąd przy nieprawidłowym weekday', () => {
    const bad = {
      ...validPlan,
      days: [{ ...validPlan.days[0], weekday: 'monday' }],
    }
    expect(() => parseMonthPlan(bad)).toThrow()
  })

  it('rzuca błąd przy nieprawidłowym URL w sources', () => {
    const bad = {
      ...validPlan,
      days: [{ ...validPlan.days[0], sources: ['not-a-url'] }],
    }
    expect(() => parseMonthPlan(bad)).toThrow()
  })

  it('akceptuje occasion = null', () => {
    const result = parseMonthPlan(validPlan)
    expect(result.days[1].occasion).toBeNull()
  })

  it('akceptuje seriesNotes = null', () => {
    const withNullNotes = { ...validPlan, seriesNotes: null }
    const result = parseMonthPlan(withNullNotes)
    expect(result.seriesNotes).toBeNull()
  })

  it('rzuca czytelny błąd z listą problemów', () => {
    expect(() => parseMonthPlan({})).toThrow('Nieprawidłowa struktura planu miesiąca')
  })
})

describe('MonthPlanSchema JSON Schema', () => {
  it('toJSONSchema zwraca obiekt z type: object', () => {
    const jsonSchema = z.toJSONSchema(MonthPlanSchema)
    expect(jsonSchema).toHaveProperty('type')
  })
})
