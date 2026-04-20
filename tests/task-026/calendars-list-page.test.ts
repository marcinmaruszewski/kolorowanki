import { beforeAll, describe, expect, it } from 'vitest'
import { BASE, devLogin, fetchText, waitForApp } from '../helpers/app'

describe('task-026: calendars list page', () => {
  beforeAll(async () => {
    await waitForApp()
  })

  it('bez sesji przekierowuje do /login', async () => {
    const res = await fetch(`${BASE}/kalendarze`, { redirect: 'manual' })

    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('po dev-login renderuje listę kalendarzy', async () => {
    const email = `test-calendars-${Date.now()}@example.com`
    const { cookie } = await devLogin(email)
    const { res, text } = await fetchText('/kalendarze', {
      headers: { cookie },
    })

    expect(res.status).toBe(200)
    expect(text).toContain('Moje kalendarze')
    expect(text).toContain('Nowy kalendarz')
    expect(text).toContain('Nie masz jeszcze żadnego kalendarza')
  })
})
