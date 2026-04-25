'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUser } from '@/lib/auth/current-user'
import { enqueuePdf } from '@/lib/queue/queues'

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

export async function exportPdf(
  calendarId: number,
  layoutJson: Record<string, unknown>,
): Promise<{ jobId: string }> {
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

  // Zapisz aktualny layout przed eksportem
  await payload.update({
    collection: 'calendars',
    id: calendarId,
    data: { layoutJson, status: 'composed' },
    overrideAccess: true,
  })

  // Idempotentność: zwróć istniejący pending/running job zamiast tworzyć nowy
  const { docs: existing } = await payload.find({
    collection: 'generation-jobs',
    where: {
      and: [
        { calendar: { equals: calendarId } },
        { type: { equals: 'pdf' } },
        { status: { in: ['queued', 'submitted', 'in-progress'] } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.length > 0) {
    return { jobId: String(existing[0].id) }
  }

  const genJob = await payload.create({
    collection: 'generation-jobs',
    data: {
      calendar: calendarId,
      type: 'pdf',
      status: 'queued',
      startedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  await enqueuePdf(String(calendarId))

  return { jobId: String(genJob.id) }
}
