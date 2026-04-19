import { describe, it, expect, beforeAll } from 'vitest'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

// Unique suffix so parallel runs don't collide
const SUFFIX = Date.now()
const EMAIL = `test-user-${SUFFIX}@example.com`
const PASSWORD = 'TestPass123!'

describe('task-006: users collection', () => {
  let userId: number
  let token: string

  beforeAll(async () => {
    // Create a fresh user via public POST /api/users
    const res = await fetch(`${BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    })
    expect(res.status, `POST /api/users should return 2xx (got ${res.status})`).toBeGreaterThanOrEqual(200)
    expect(res.status).toBeLessThan(300)
    const body = await res.json() as { doc?: { id: number; role?: string; calendarsThisMonth?: number } }
    expect(body.doc).toBeDefined()
    userId = body.doc!.id
    expect(body.doc!.role, 'default role should be user').toBe('user')
    expect(body.doc!.calendarsThisMonth, 'default calendarsThisMonth should be 0').toBe(0)
  })

  it('login as non-admin user', async () => {
    const res = await fetch(`${BASE}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { token?: string }
    expect(body.token).toBeDefined()
    token = body.token!
  })

  it('non-admin cannot escalate own role to admin', async () => {
    const res = await fetch(`${BASE}/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${token}`,
      },
      body: JSON.stringify({ role: 'admin' }),
    })
    // Either 403 or 200 with role unchanged
    if (res.status === 200) {
      const body = await res.json() as { doc?: { role?: string } }
      expect(body.doc?.role, 'role must not be changed to admin').toBe('user')
    } else {
      expect(res.status).toBe(403)
    }
  })

  it('non-admin cannot change own calendarsThisMonth', async () => {
    const res = await fetch(`${BASE}/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${token}`,
      },
      body: JSON.stringify({ calendarsThisMonth: 99 }),
    })
    if (res.status === 200) {
      const body = await res.json() as { doc?: { calendarsThisMonth?: number } }
      expect(body.doc?.calendarsThisMonth, 'calendarsThisMonth must not be changed by user').toBe(0)
    } else {
      expect(res.status).toBe(403)
    }
  })
})
