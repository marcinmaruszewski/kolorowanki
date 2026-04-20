export const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

interface WaitOptions {
  attempts?: number
  delayMs?: number
  path?: string
}

export async function waitForApp({
  attempts = 60,
  delayMs = 1000,
  path = '/login',
}: WaitOptions = {}): Promise<void> {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(`${BASE}${path}`, { redirect: 'manual' })
      if (res.status > 0) {
        return
      }
    } catch (error) {
      lastError = error
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  throw new Error(`App not ready at ${BASE}${path}: ${String(lastError)}`)
}

export async function fetchText(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; text: string }> {
  const res = await fetch(`${BASE}${path}`, init)
  const text = await res.text()
  return { res, text }
}

export function extractCookie(setCookieHeader: string | null): string {
  if (!setCookieHeader) {
    throw new Error('Missing set-cookie header')
  }

  const cookie = setCookieHeader.split(';')[0]?.trim()
  if (!cookie) {
    throw new Error(`Invalid set-cookie header: ${setCookieHeader}`)
  }

  return cookie
}

export async function devLogin(email: string): Promise<{
  cookie: string
  body: { userId: number; email: string; role: string }
}> {
  const res = await fetch(`${BASE}/api/auth/dev-login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (res.status !== 200) {
    const text = await res.text()
    throw new Error(`Dev login failed with ${res.status}: ${text}`)
  }

  const cookie = extractCookie(res.headers.get('set-cookie'))
  const body = (await res.json()) as { userId: number; email: string; role: string }

  return { cookie, body }
}
