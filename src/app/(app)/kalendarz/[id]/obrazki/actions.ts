'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUser } from '@/lib/auth/current-user'
import { singleImageQueue } from '@/lib/queue/queues'

const REGEN_LIMIT = 20

export async function regenerateDay(
  dayId: number,
  newPrompt?: string,
): Promise<{ jobId?: string; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Brak autoryzacji.' }

  const payload = await getPayload({ config: configPromise })

  const day = await payload
    .findByID({ collection: 'days', id: dayId, overrideAccess: true })
    .catch(() => null)
  if (!day) return { error: 'Nie znaleziono dnia.' }

  const calendarId = typeof day.calendar === 'number' ? day.calendar : (day.calendar as { id: number }).id

  const calendar = await payload
    .findByID({ collection: 'calendars', id: calendarId, overrideAccess: true })
    .catch(() => null)
  if (!calendar) return { error: 'Nie znaleziono kalendarza.' }

  const ownerId = typeof calendar.owner === 'object' ? calendar.owner.id : calendar.owner
  if (ownerId !== user.id && user.role !== 'admin') return { error: 'Brak autoryzacji.' }

  const { totalDocs: successCount } = await payload.find({
    collection: 'generation-jobs',
    where: {
      and: [
        { calendar: { equals: calendarId } },
        { type: { equals: 'single-image' } },
        { status: { not_equals: 'failed' } },
      ],
    },
    limit: 0,
    overrideAccess: true,
  })

  if (successCount >= REGEN_LIMIT) {
    return { error: `Wykorzystałeś limit ${REGEN_LIMIT} regeneracji na ten kalendarz.` }
  }

  const bullJob = await singleImageQueue.add(
    'single-image',
    { dayId: String(dayId), newPrompt },
    { attempts: 2, backoff: { type: 'exponential', delay: 5_000 } },
  )

  return { jobId: bullJob.id }
}
