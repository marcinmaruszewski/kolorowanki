import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthUrl } from '../../src/lib/auth/google'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

describe('task-008: google OAuth helper', () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback'
  })

  it('buildAuthUrl generates correct Google OAuth URL', () => {
    const state = 'test-state-abc123'
    const url = buildAuthUrl(state)

    expect(url).toContain('accounts.google.com')
    expect(url).toContain('response_type=code')
    expect(url).toContain('client_id=test-client-id')
    expect(url).toContain('state=test-state-abc123')
    expect(url).toContain('openid')
    expect(url).toContain('email')
  })
})

describe('task-008: /api/auth/google/start endpoint', () => {
  it('GET /api/auth/google/start redirects to accounts.google.com', async () => {
    const res = await fetch(`${BASE}/api/auth/google/start`, {
      redirect: 'manual',
    })

    expect(res.status, `should return 302, got ${res.status}`).toBe(302)
    const location = res.headers.get('location') ?? ''
    expect(location, `Location header should point to Google, got: ${location}`).toContain(
      'accounts.google.com',
    )
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie, 'should set oauth_state cookie').toContain('oauth_state')
  })
})

describe('task-008: /api/auth/google/callback endpoint', () => {
  it('GET /api/auth/google/callback without state cookie returns 400', async () => {
    const res = await fetch(
      `${BASE}/api/auth/google/callback?code=fake-code&state=mismatched-state`,
      { redirect: 'manual' },
    )
    expect(res.status, `should return 400, got ${res.status}`).toBe(400)
  })

  it('GET /api/auth/google/callback with wrong state returns 400', async () => {
    // First get the state cookie
    const startRes = await fetch(`${BASE}/api/auth/google/start`, {
      redirect: 'manual',
    })
    const setCookieHeader = startRes.headers.get('set-cookie') ?? ''
    const stateMatch = setCookieHeader.match(/oauth_state=([^;]+)/)
    const stateCookieValue = stateMatch?.[1]

    expect(stateCookieValue).toBeDefined()

    // Use a mismatched state in the query param
    const res = await fetch(
      `${BASE}/api/auth/google/callback?code=fake-code&state=wrong-state`,
      {
        redirect: 'manual',
        headers: {
          cookie: `oauth_state=${stateCookieValue}`,
        },
      },
    )
    expect(res.status, `should return 400 for mismatched state, got ${res.status}`).toBe(400)
  })
})
