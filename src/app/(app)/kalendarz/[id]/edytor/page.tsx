import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUser } from '@/lib/auth/current-user'
import { FabricCanvas } from './fabric-canvas'
import type { Day, Media } from '@/payload-types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditorPage({ params }: Props) {
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

  if (calendar.status !== 'generated') redirect(`/kalendarz/${id}/obrazki`)

  const { docs: days } = await payload.find({
    collection: 'days',
    where: { calendar: { equals: calendar.id } },
    sort: 'day',
    limit: 31,
    depth: 1,
    overrideAccess: true,
  })

  const daysWithImages = (days as Day[]).filter(
    (d) => d.status === 'generated' && d.image && (d.image as Media).url,
  )

  return (
    <main className="page-content">
      <div className="page-header">
        <h1>
          Edytor — {calendar.month}/{calendar.year}
        </h1>
      </div>
      <FabricCanvas days={daysWithImages as Day[]} daysInMonth={days.length} />
    </main>
  )
}
