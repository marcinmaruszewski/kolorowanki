import { beforeAll, describe, expect, it } from 'vitest'
import { fetchText, waitForApp } from '../helpers/app'

describe('task-024: login page', () => {
  beforeAll(async () => {
    await waitForApp()
  })

  it('renderuje stronę logowania po polsku', async () => {
    const { res, text } = await fetchText('/login')

    expect(res.status).toBe(200)
    expect(text).toContain('Zaloguj się, żeby wygenerować kalendarz kolorowanek')
    expect(text).toContain('/api/auth/google/start')
    expect(text).toContain('Zaloguj przez Google')
  })

  it('pokazuje dev-login gdy ENABLE_DEV_LOGIN=true', async () => {
    const { text } = await fetchText('/login')

    if (process.env.ENABLE_DEV_LOGIN === 'true') {
      expect(text).toContain('/api/auth/dev-login')
      expect(text).toContain('Zaloguj (dev)')
    }
  })
})
