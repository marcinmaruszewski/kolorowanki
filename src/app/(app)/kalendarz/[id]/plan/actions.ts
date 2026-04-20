'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUser } from '@/lib/auth/current-user'
import { revalidatePath } from 'next/cache'

interface DayUpdate {
  id: number
  occasion: string
  motif: string
}

export async function updateDays(
  calendarId: number,
  updates: DayUpdate[],
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Brak autoryzacji.' }

  const payload = await getPayload({ config: configPromise })

  const calendar = await payload
    .findByID({ collection: 'calendars', id: calendarId, overrideAccess: true })
    .catch(() => null)
  if (!calendar) return { error: 'Nie znaleziono kalendarza.' }

  const ownerId = typeof calendar.owner === 'object' ? calendar.owner.id : calendar.owner
  if (ownerId !== user.id && user.role !== 'admin') return { error: 'Brak autoryzacji.' }

  if (calendar.status === 'generated') {
    return { error: 'Nie można edytować planu po wygenerowaniu obrazków.' }
  }

  for (const upd of updates) {
    const motif = upd.motif.trim()
    const occasion = upd.occasion.trim()
    if (motif.length < 10 || motif.length > 300) {
      return { error: `Motyw dnia ${upd.id}: musi mieć 10–300 znaków.` }
    }
    if (occasion.length > 200) {
      return { error: `Okazja dnia ${upd.id}: maksymalnie 200 znaków.` }
    }
    await payload.update({
      collection: 'days',
      id: upd.id,
      data: { occasion: occasion || null, motif },
      overrideAccess: true,
    })
  }

  revalidatePath(`/kalendarz/${calendarId}/plan`)
  return {}
}
