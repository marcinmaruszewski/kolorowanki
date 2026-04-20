'use server'

import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUser } from '@/lib/auth/current-user'
import { enqueueResearch } from '@/lib/queue/queues'

export type CreateCalendarResult = { error: string } | null

export async function createCalendar(year: number, month: number): Promise<CreateCalendarResult> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Brak autoryzacji. Zaloguj się ponownie.' }

  const payload = await getPayload({ config: configPromise })

  // Check for duplicate (year, month) first
  const { totalDocs: existing } = await payload.find({
    collection: 'calendars',
    where: {
      and: [
        { owner: { equals: user.id } },
        { year: { equals: year } },
        { month: { equals: month } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (existing > 0) {
    return { error: 'Masz już kalendarz na ten miesiąc — otwórz go zamiast tworzyć nowy.' }
  }

  // Check monthly quota
  if (user.role !== 'admin') {
    const { docs } = await payload.find({
      collection: 'users',
      where: { id: { equals: user.id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const freshUser = docs[0]
    if (freshUser && (freshUser.calendarsThisMonth ?? 0) >= 1) {
      return {
        error:
          'Wygenerowałeś już kalendarz w tym miesiącu. Spróbuj od 1. dnia następnego miesiąca.',
      }
    }
    // Increment counter
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { calendarsThisMonth: (freshUser?.calendarsThisMonth ?? 0) + 1 },
      overrideAccess: true,
    })
  }

  let calendarId: string | number
  try {
    const calendar = await payload.create({
      collection: 'calendars',
      data: { owner: user.id, year, month, status: 'draft' },
      overrideAccess: true,
    })
    calendarId = calendar.id
  } catch (err: unknown) {
    // Undo counter increment on failure
    if (user.role !== 'admin') {
      const { docs } = await payload.find({
        collection: 'users',
        where: { id: { equals: user.id } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const current = docs[0]?.calendarsThisMonth ?? 1
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { calendarsThisMonth: Math.max(0, current - 1) },
        overrideAccess: true,
      })
    }
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Nie udało się utworzyć kalendarza: ${msg}` }
  }

  await enqueueResearch(String(calendarId))
  redirect(`/kalendarz/${calendarId}/plan`)
}
