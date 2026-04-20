import { createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { User } from '@/payload-types'

// Verify HS256 JWT without CSRF checks — safe for server-side use only
function decodePayloadJWT(token: string, secret: string): { id: number; exp?: number } | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts
  const expected = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url')
  if (signature !== expected) return null
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      id: number
      exp?: number
    }
    if (decoded.exp && Date.now() / 1000 > decoded.exp) return null
    return decoded
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const cookieStore = await cookies()
    const cookiePrefix = payload.config.cookiePrefix ?? 'payload'
    const token = cookieStore.get(`${cookiePrefix}-token`)?.value
    if (!token) return null

    const decoded = decodePayloadJWT(token, payload.secret)
    if (!decoded?.id) return null

    const user = await payload.findByID({
      collection: 'users',
      id: decoded.id,
      overrideAccess: true,
    })
    return user as User
  } catch {
    return null
  }
}
