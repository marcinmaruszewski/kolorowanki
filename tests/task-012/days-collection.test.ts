import { describe, it, expect } from 'vitest'
import { Days } from '../../src/payload/collections/days'

describe('Days collection config', () => {
  it('ma slug "days"', () => {
    expect(Days.slug).toBe('days')
  })

  it('ma unikalny indeks złożony na calendar/day', () => {
    const indexes = (Days as any).indexes ?? []
    const unique = indexes.find(
      (idx: any) =>
        idx.unique === true &&
        idx.fields.includes('calendar') &&
        idx.fields.includes('day'),
    )
    expect(unique).toBeDefined()
  })

  it('ma pole calendar jako relację do calendars', () => {
    const fields = Days.fields as any[]
    const calendar = fields.find((f) => f.name === 'calendar')
    expect(calendar).toBeDefined()
    expect(calendar.type).toBe('relationship')
    expect(calendar.relationTo).toBe('calendars')
    expect(calendar.required).toBe(true)
    expect(calendar.hasMany).toBe(false)
  })

  it('ma pole day z min/max', () => {
    const fields = Days.fields as any[]
    const day = fields.find((f) => f.name === 'day')
    expect(day).toBeDefined()
    expect(day.type).toBe('number')
    expect(day.required).toBe(true)
    expect(day.min).toBe(1)
    expect(day.max).toBe(31)
  })

  it('ma pole weekday jako select z 7 opcjami', () => {
    const fields = Days.fields as any[]
    const weekday = fields.find((f) => f.name === 'weekday')
    expect(weekday).toBeDefined()
    expect(weekday.type).toBe('select')
    expect((weekday.options as string[]).length).toBe(7)
  })

  it('ma pole occasion jako text', () => {
    const fields = Days.fields as any[]
    const occasion = fields.find((f) => f.name === 'occasion')
    expect(occasion).toBeDefined()
    expect(occasion.type).toBe('text')
  })

  it('ma pole motif jako textarea', () => {
    const fields = Days.fields as any[]
    const motif = fields.find((f) => f.name === 'motif')
    expect(motif).toBeDefined()
    expect(motif.type).toBe('textarea')
  })

  it('ma pole prompt jako textarea', () => {
    const fields = Days.fields as any[]
    const prompt = fields.find((f) => f.name === 'prompt')
    expect(prompt).toBeDefined()
    expect(prompt.type).toBe('textarea')
  })

  it('ma pole image jako upload do media', () => {
    const fields = Days.fields as any[]
    const image = fields.find((f) => f.name === 'image')
    expect(image).toBeDefined()
    expect(image.type).toBe('upload')
    expect(image.relationTo).toBe('media')
  })

  it('ma pole status z opcjami i domyślnie "planned"', () => {
    const fields = Days.fields as any[]
    const status = fields.find((f) => f.name === 'status')
    expect(status).toBeDefined()
    expect(status.type).toBe('select')
    expect(status.defaultValue).toBe('planned')
    const opts = status.options as string[]
    expect(opts).toContain('planned')
    expect(opts).toContain('prompting')
    expect(opts).toContain('generating')
    expect(opts).toContain('generated')
    expect(opts).toContain('failed')
  })

  it('ma pole sources jako array z polem url', () => {
    const fields = Days.fields as any[]
    const sources = fields.find((f) => f.name === 'sources')
    expect(sources).toBeDefined()
    expect(sources.type).toBe('array')
    const urlField = (sources.fields as any[]).find((f: any) => f.name === 'url')
    expect(urlField).toBeDefined()
    expect(urlField.type).toBe('text')
  })
})
