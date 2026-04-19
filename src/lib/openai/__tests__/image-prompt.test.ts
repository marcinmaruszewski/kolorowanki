import { describe, it, expect } from 'vitest'
import { buildImagePrompt } from '../image-prompt'

describe('buildImagePrompt', () => {
  it('zawiera datę DD.MM', () => {
    const prompt = buildImagePrompt({ day: 5, month: 4, occasion: 'Wielkanoc', motif: 'koszyk', seriesDirection: null })
    expect(prompt).toContain('05.04')
  })

  it('zawiera motyw', () => {
    const prompt = buildImagePrompt({ day: 5, month: 4, occasion: 'Wielkanoc', motif: 'koszyk', seriesDirection: null })
    expect(prompt).toContain('koszyk')
  })

  it('zawiera okazję w motywie dnia', () => {
    const prompt = buildImagePrompt({ day: 5, month: 4, occasion: 'Wielkanoc', motif: 'koszyk', seriesDirection: null })
    expect(prompt).toContain('Wielkanoc')
  })

  it('bez okazji nie zawiera nawiasów z null', () => {
    const prompt = buildImagePrompt({ day: 1, month: 5, occasion: null, motif: 'kwiat', seriesDirection: null })
    expect(prompt).not.toContain('null')
    expect(prompt).toContain('kwiat')
    expect(prompt).toContain('01.05')
  })

  it('prepend seriesDirection gdy podane', () => {
    const prompt = buildImagePrompt({ day: 1, month: 1, occasion: null, motif: 'śnieg', seriesDirection: 'grubość konturu 2px' })
    expect(prompt).toMatch(/^Series constraints: grubość konturu 2px/)
  })

  it('brak seriesDirection — brak prefiksu Series constraints', () => {
    const prompt = buildImagePrompt({ day: 1, month: 1, occasion: null, motif: 'śnieg', seriesDirection: null })
    expect(prompt).not.toContain('Series constraints')
  })

  it('poprawne padowanie dnia i miesiąca jednocyfrowego', () => {
    const prompt = buildImagePrompt({ day: 3, month: 9, occasion: null, motif: 'jabłko', seriesDirection: null })
    expect(prompt).toContain('03.09')
  })

  it('snapshot dla Wielkanoc bez seriesDirection', () => {
    const prompt = buildImagePrompt({ day: 5, month: 4, occasion: 'Wielkanoc', motif: 'koszyk', seriesDirection: null })
    expect(prompt).toMatchSnapshot()
  })

  it('snapshot z seriesDirection', () => {
    const prompt = buildImagePrompt({ day: 1, month: 1, occasion: null, motif: 'śnieg', seriesDirection: 'grubość konturu 2px' })
    expect(prompt).toMatchSnapshot()
  })
})
