import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUser } from '@/lib/auth/current-user'
import { PlanTable } from './plan-table'
import type { Day } from '@/payload-types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlanPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayload({ config: configPromise })

  const calendar = await payload.findByID({
    collection: 'calendars',
    id: Number(id),
    overrideAccess: true,
  }).catch(() => null)

  if (!calendar) notFound()

  const ownerId = typeof calendar.owner === 'object' ? calendar.owner.id : calendar.owner
  if (ownerId !== user.id && user.role !== 'admin') notFound()

  const { docs: days } = await payload.find({
    collection: 'days',
    where: { calendar: { equals: calendar.id } },
    sort: 'day',
    limit: 31,
    overrideAccess: true,
  })

  const isResearching = calendar.status === 'draft' && days.length === 0

  return (
    <main className="page-content">
      <div className="page-header">
        <h1>
          Plan — {calendar.month}/{calendar.year}
        </h1>
      </div>

      {isResearching ? (
        <>
          <meta httpEquiv="refresh" content="5" />
          <div className="plan-pending">
            <p className="plan-pending-msg">Generujemy plan… (zwykle 10–15 min)</p>
            <p className="plan-pending-hint">Strona odświeży się automatycznie co 5 sekund.</p>
          </div>
        </>
      ) : (
        <>
          <PlanTable
            days={days as Day[]}
            year={calendar.year}
            month={calendar.month}
            calendarId={calendar.id}
            editable={calendar.status === 'draft' || calendar.status === 'planned'}
          />

          <div className="plan-actions">
            <button className="btn btn-primary" disabled>
              Dalej: wygeneruj obrazki
            </button>
          </div>
        </>
      )}
    </main>
  )
}
