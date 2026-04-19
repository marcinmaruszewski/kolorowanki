import { OAuth2Client } from 'google-auth-library'

function getClient(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

export function buildAuthUrl(state: string): string {
  return getClient().generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    response_type: 'code',
    state,
  })
}

export async function exchangeCodeForIdToken(code: string): Promise<{
  sub: string
  email: string
  emailVerified: boolean
  name: string
}> {
  const client = getClient()
  const { tokens } = await client.getToken(code)
  client.setCredentials(tokens)

  const idToken = tokens.id_token
  if (!idToken) throw new Error('Brak id_token w odpowiedzi Google')

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload) throw new Error('Nie udało się zweryfikować tokena Google')

  return {
    sub: payload.sub,
    email: payload.email ?? '',
    emailVerified: payload.email_verified ?? false,
    name: payload.name ?? '',
  }
}
