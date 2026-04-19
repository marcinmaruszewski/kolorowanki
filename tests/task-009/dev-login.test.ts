import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

describe('task-009: /api/auth/dev-login endpoint', () => {
  it('POST /api/auth/dev-login returns 200 + cookie when ENABLE_DEV_LOGIN=true', async () => {
    const email = `devtest-${Date.now()}@example.com`
    const res = await fetch(`${BASE}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    expect(res.status, `oczekiwano 200, dostano ${res.status}`).toBe(200)

    const body = await res.json()
    expect(body.email).toBe(email)
    expect(body.role).toBe('user')
    expect(body.userId).toBeDefined()

    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie, 'powinno ustawić cookie payload-token').toContain('payload-token')
  })

  it('POST /api/auth/dev-login jest idempotentny — nie tworzy duplikatów', async () => {
    const email = `idempotent-${Date.now()}@example.com`

    const res1 = await fetch(`${BASE}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const body1 = await res1.json()

    const res2 = await fetch(`${BASE}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const body2 = await res2.json()

    expect(res2.status).toBe(200)
    expect(body1.userId).toBe(body2.userId)
  })
})
