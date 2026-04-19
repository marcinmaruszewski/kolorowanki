import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload, getFieldsToSign, jwtSign } from 'payload'
import { generatePayloadCookie } from 'payload/shared'
import configPromise from '@payload-config'
import { exchangeCodeForIdToken } from '@/lib/auth/google'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value

  if (!storedState || !state || state !== storedState) {
    return NextResponse.json({ error: 'Nieprawidłowy parametr state' }, { status: 400 })
  }

  cookieStore.delete('oauth_state')

  if (!code) {
    return NextResponse.json({ error: 'Brak kodu autoryzacji' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  const googleUser = await exchangeCodeForIdToken(code)

  const collectionConfig = payload.collections['users']?.config
  if (!collectionConfig) {
    return NextResponse.json({ error: 'Błąd konfiguracji' }, { status: 500 })
  }

  let existingUsers = await payload.find({
    collection: 'users',
    where: { googleSub: { equals: googleUser.sub } },
    limit: 1,
    overrideAccess: true,
  })

  let user = existingUsers.docs[0]

  if (!user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user = await (payload.create as any)({
      collection: 'users',
      data: {
        email: googleUser.email,
        googleSub: googleUser.sub,
        role: 'user',
        // dummy password — user never logs in with password
        password: `google-${googleUser.sub}`,
      },
      overrideAccess: true,
    })
  }

  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: user.email,
    user: user as Parameters<typeof getFieldsToSign>[0]['user'],
  })

  const { token } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration ?? 7200,
  })

  const authConfig = collectionConfig.auth
  const cookieData = generatePayloadCookie({
    collectionAuthConfig: authConfig,
    cookiePrefix: payload.config.cookiePrefix,
    returnCookieAsObject: true,
    token,
  })

  if (cookieData.value) {
    cookieStore.set(cookieData.name, cookieData.value, {
      domain: authConfig.cookies?.domain,
      expires: cookieData.expires ? new Date(cookieData.expires) : undefined,
      httpOnly: true,
      sameSite:
        typeof authConfig.cookies?.sameSite === 'string'
          ? (authConfig.cookies.sameSite.toLowerCase() as 'lax' | 'strict' | 'none')
          : 'lax',
      secure: authConfig.cookies?.secure ?? false,
      path: '/',
    })
  }

  return NextResponse.redirect(new URL('/kalendarze', req.nextUrl.origin), { status: 302 })
}
