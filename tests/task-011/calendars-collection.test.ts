import { describe, it, expect } from 'vitest'
import { Calendars } from '../../src/payload/collections/calendars'

describe('Calendars collection config', () => {
  it('ma slug "calendars"', () => {
    expect(Calendars.slug).toBe('calendars')
  })

  it('ma useAsTitle ustawione na "label"', () => {
    expect((Calendars.admin as any)?.useAsTitle).toBe('label')
  })

  it('ma hook enforceCalendarQuota w beforeChange', () => {
    const hooks = Calendars.hooks?.beforeChange ?? []
    expect(hooks.length).toBeGreaterThan(0)
  })

  it('ma pole year z min/max', () => {
    const fields = Calendars.fields as any[]
    const year = fields.find((f) => f.name === 'year')
    expect(year).toBeDefined()
    expect(year.type).toBe('number')
    expect(year.required).toBe(true)
    expect(year.min).toBe(2025)
    expect(year.max).toBe(2100)
  })

  it('ma pole month z min/max', () => {
    const fields = Calendars.fields as any[]
    const month = fields.find((f) => f.name === 'month')
    expect(month).toBeDefined()
    expect(month.type).toBe('number')
    expect(month.required).toBe(true)
    expect(month.min).toBe(1)
    expect(month.max).toBe(12)
  })

  it('ma pole owner jako relację do users', () => {
    const fields = Calendars.fields as any[]
    const owner = fields.find((f) => f.name === 'owner')
    expect(owner).toBeDefined()
    expect(owner.type).toBe('relationship')
    expect(owner.relationTo).toBe('users')
    expect(owner.required).toBe(true)
  })

  it('ma pole status z opcjami draft/planned/generated/composed/exported', () => {
    const fields = Calendars.fields as any[]
    const status = fields.find((f) => f.name === 'status')
    expect(status).toBeDefined()
    expect(status.type).toBe('select')
    expect(status.defaultValue).toBe('draft')
    const opts = status.options as string[]
    expect(opts).toContain('draft')
    expect(opts).toContain('planned')
    expect(opts).toContain('generated')
    expect(opts).toContain('composed')
    expect(opts).toContain('exported')
  })

  it('ma unikalny indeks złożony na owner/year/month', () => {
    const indexes = (Calendars as any).indexes ?? []
    const unique = indexes.find(
      (idx: any) =>
        idx.unique === true &&
        idx.fields.includes('owner') &&
        idx.fields.includes('year') &&
        idx.fields.includes('month'),
    )
    expect(unique).toBeDefined()
  })

  it('label hook generuje YYYY-MM', () => {
    const fields = Calendars.fields as any[]
    const label = fields.find((f) => f.name === 'label')
    expect(label).toBeDefined()
    const hookFn = label.hooks?.beforeChange?.[0]
    expect(hookFn).toBeDefined()
    const result = hookFn({ data: { year: 2026, month: 5 } })
    expect(result).toBe('2026-05')
  })

  it('label hook paduje jednocyfrowe miesiące', () => {
    const fields = Calendars.fields as any[]
    const label = fields.find((f) => f.name === 'label')
    const hookFn = label.hooks?.beforeChange?.[0]
    const result = hookFn({ data: { year: 2026, month: 1 } })
    expect(result).toBe('2026-01')
  })
})
