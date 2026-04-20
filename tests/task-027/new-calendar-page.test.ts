import { beforeAll, describe, expect, it } from 'vitest'
import { devLogin, fetchText, waitForApp } from '../helpers/app'

describe('task-027: new calendar page', () => {
  beforeAll(async () => {
    await waitForApp()
  })

  it('po dev-login renderuje kreator z polskimi miesiącami', async () => {
    const email = `test-new-calendar-${Date.now()}@example.com`
    const { cookie } = await devLogin(email)
    const { res, text } = await fetchText('/kalendarz/nowy', {
      headers: { cookie },
    })

    expect(res.status).toBe(200)
    expect(text).toContain('Nowy kalendarz')
    expect(text).toContain('Wybierz miesiąc')
    expect(text).toContain('Styczeń')
    expect(text).toContain('Grudzień')
  })
})
