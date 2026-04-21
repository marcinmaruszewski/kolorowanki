import React from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUser } from '@/lib/auth/current-user'
import { DayTile } from './day-tile'
import { RegenerateCounter } from './regenerate-counter'
import { countRegenerationsUsed } from '@/lib/quota/regenerations'
import type { Day } from '@/payload-types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GalleryPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayload({ config: configPromise })

  const calendar = await payload
    .findByID({
      collection: 'calendars',
      id: Number(id),
      overrideAccess: true,
    })
    .catch(() => null)

  if (!calendar) notFound()

  const ownerId = typeof calendar.owner === 'object' ? calendar.owner.id : calendar.owner
  if (ownerId !== user.id && user.role !== 'admin') notFound()

  const { docs: days } = await payload.find({
    collection: 'days',
    where: { calendar: { equals: calendar.id } },
    sort: 'day',
    limit: 31,
    depth: 1, // populate image media
    overrideAccess: true,
  })

  const anyPending = days.some((d) => d.status !== 'generated')
  const allGenerated = days.length > 0 && !anyPending

  const regenerationsUsed = await countRegenerationsUsed(calendar.id)
  const regenDisabled = regenerationsUsed >= 20

  // Compute leading empty cells: JS getDay() 0=Sun, convert to Mon=0
  const jsDay = new Date(calendar.year, calendar.month - 1, 1).getDay()
  const leadingCells = jsDay === 0 ? 6 : jsDay - 1

  return (
    <main className="page-content">
      {anyPending && <meta httpEquiv="refresh" content="10" />}

      <div className="page-header">
        <h1>
          Obrazki — {calendar.month}/{calendar.year}
        </h1>
        <div className="page-header-actions">
          <Link
            href={`/kalendarz/${id}/edytor`}
            className={`btn btn-primary${!allGenerated ? ' btn-disabled' : ''}`}
            aria-disabled={!allGenerated}
            tabIndex={!allGenerated ? -1 : undefined}
          >
            Do edytora
          </Link>
        </div>
      </div>

      <RegenerateCounter used={regenerationsUsed} />

      {anyPending && (
        <p className="gallery-pending-hint">
          Generowanie w toku… Strona odświeży się automatycznie co 10 sekund.
        </p>
      )}

      <div className="day-grid">
        {/* weekday headers */}
        {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'].map((h) => (
          <div key={h} className="day-grid-header">
            {h}
          </div>
        ))}

        {/* leading empty cells */}
        {Array.from({ length: leadingCells }).map((_, i) => (
          <div key={`empty-${i}`} className="day-tile day-tile-empty" />
        ))}

        {/* day tiles */}
        {(days as Day[]).map((day) => (
          <DayTile key={day.id} day={day} regenDisabled={regenDisabled} />
        ))}
      </div>
    </main>
  )
}
