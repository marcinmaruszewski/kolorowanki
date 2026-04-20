import { beforeAll, describe, expect, it } from 'vitest'
import { devLogin, fetchText, waitForApp } from '../helpers/app'

describe('task-025: auth-aware nav bar', () => {
  beforeAll(async () => {
    await waitForApp()
  })

  it('bez sesji pokazuje link Zaloguj', async () => {
    const { res, text } = await fetchText('/login')

    expect(res.status).toBe(200)
    expect(text).toContain('>Zaloguj<')
    expect(text).not.toContain('Wyloguj')
  })

  it('z sesją pokazuje Wyloguj i Moje kalendarze', async () => {
    const email = `test-nav-${Date.now()}@example.com`
    const { cookie } = await devLogin(email)
    const { res, text } = await fetchText('/login', {
      headers: { cookie },
    })

    expect(res.status).toBe(200)
    expect(text).toContain('Wyloguj')
    expect(text).toContain('Moje kalendarze')
  })
})
