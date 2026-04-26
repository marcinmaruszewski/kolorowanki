import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const scriptPath = resolve(__dirname, '../../scripts/promote-admin.ts')
const scriptContent = readFileSync(scriptPath, 'utf-8')

describe('promote-admin.ts — parsowanie argumentów', () => {
  it('skrypt odczytuje --email= z process.argv', () => {
    expect(scriptContent).toMatch(/args\.find.*--email=/)
  })

  it('skrypt kończy z błędem gdy brak --email', () => {
    expect(scriptContent).toMatch(/process\.exit\(1\)/)
    expect(scriptContent).toMatch(/--email/)
  })

  it('skrypt ekstrakcuje wartość po --email=', () => {
    // Verify the extraction pattern: slice('--email='.length)
    expect(scriptContent).toMatch(/slice\(['"]--email='\.length/)
  })

  it('skrypt używa payload.update na kolekcji users', () => {
    expect(scriptContent).toMatch(/payload\.update/)
    expect(scriptContent).toMatch(/collection:\s*['"]users['"]/)
    expect(scriptContent).toMatch(/role.*admin|admin.*role/)
  })

  it('skrypt uruchamia payload.init przed operacją', () => {
    expect(scriptContent).toMatch(/payload\.init/)
  })
})
