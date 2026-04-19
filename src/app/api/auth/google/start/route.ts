import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/auth/google'

export async function GET(): Promise<NextResponse> {
  const state = randomBytes(32).toString('hex')

  const cookieStore = await cookies()
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })

  const url = buildAuthUrl(state)
  return NextResponse.redirect(url, { status: 302 })
}
