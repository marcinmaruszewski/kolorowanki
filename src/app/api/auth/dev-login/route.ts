import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload, getFieldsToSign, jwtSign } from 'payload'
import { generatePayloadCookie } from 'payload/shared'
import configPromise from '@payload-config'

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.ENABLE_DEV_LOGIN !== 'true') {
    return new NextResponse(null, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : ''

  if (!email) {
    return NextResponse.json({ error: 'Brak pola email' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  const collectionConfig = payload.collections['users']?.config
  if (!collectionConfig) {
    return NextResponse.json({ error: 'Błąd konfiguracji' }, { status: 500 })
  }

  let existingUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  let user = existingUsers.docs[0]

  if (!user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user = await (payload.create as any)({
      collection: 'users',
      data: {
        email,
        role: 'user',
        password: `dev-${Date.now()}`,
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

  const cookieStore = await cookies()
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

  return NextResponse.json({ userId: user.id, email: user.email, role: user.role })
}
