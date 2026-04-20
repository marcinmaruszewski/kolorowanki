import React from 'react'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUser } from '@/lib/auth/current-user'
import { CalendarCard } from './calendar-card'
import type { Calendar, Day, Media } from '@/payload-types'
import Link from 'next/link'

export default async function KalendarzeListPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayload({ config: configPromise })

  const { docs: calendars } = await payload.find({
    collection: 'calendars',
    where: { owner: { equals: user.id } },
    sort: '-createdAt',
    limit: 50,
    overrideAccess: true,
  })

  // For each generated calendar fetch 3 sample days with images
  const calendarsWithDays = await Promise.all(
    calendars.map(async (cal) => {
      const hasImages =
        cal.status === 'generated' || cal.status === 'composed' || cal.status === 'exported'
      if (!hasImages) return cal as Calendar & { sampleDays?: Day[] }

      const { docs: days } = await payload.find({
        collection: 'days',
        where: {
          and: [{ calendar: { equals: cal.id } }, { image: { exists: true } }],
        },
        sort: 'day',
        limit: 3,
        depth: 1,
        overrideAccess: true,
      })

      return { ...cal, sampleDays: days as Day[] } as Calendar & { sampleDays: Day[] }
    }),
  )

  return (
    <main className="page-content">
      <div className="page-header">
        <h1>Moje kalendarze</h1>
        <Link href="/kalendarz/nowy" className="btn btn-primary">
          + Nowy kalendarz
        </Link>
      </div>

      {calendarsWithDays.length === 0 ? (
        <p className="empty-state">
          Nie masz jeszcze żadnego kalendarza.{' '}
          <Link href="/kalendarz/nowy">Stwórz pierwszy!</Link>
        </p>
      ) : (
        <div className="calendars-grid">
          {calendarsWithDays.map((cal) => (
            <CalendarCard key={cal.id} calendar={cal} />
          ))}
        </div>
      )}
    </main>
  )
}
