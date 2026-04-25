'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUser } from '@/lib/auth/current-user'

export async function saveLayout(calendarId: number, layoutJson: Record<string, unknown>): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Nie jesteś zalogowany')

  const payload = await getPayload({ config: configPromise })

  const calendar = await payload.findByID({
    collection: 'calendars',
    id: calendarId,
    overrideAccess: true,
  })

  const ownerId = typeof calendar.owner === 'object' ? calendar.owner.id : calendar.owner
  if (ownerId !== user.id && user.role !== 'admin') {
    throw new Error('Brak dostępu')
  }

  if (!['generated', 'composed'].includes(calendar.status)) {
    throw new Error('Nieprawidłowy status kalendarza')
  }

  await payload.update({
    collection: 'calendars',
    id: calendarId,
    data: { layoutJson, status: 'composed' },
    overrideAccess: true,
  })
}
