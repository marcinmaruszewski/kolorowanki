import React from 'react'
import Link from 'next/link'
import type { Calendar, Day, Media } from '@/payload-types'

const STATUS_LABELS: Record<Calendar['status'], string> = {
  draft: 'Szkic',
  planned: 'Zaplanowany',
  generated: 'Wygenerowany',
  composed: 'Skomponowany',
  exported: 'Wyeksportowany',
}

function calendarHref(calendar: Calendar): string {
  switch (calendar.status) {
    case 'generated':
    case 'composed':
    case 'exported':
      return `/kalendarz/${calendar.id}/obrazki`
    case 'planned':
      return `/kalendarz/${calendar.id}/plan`
    default:
      return `/kalendarz/${calendar.id}/plan`
  }
}

function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('pl-PL', { month: 'long' })
}

type CalendarWithDays = Calendar & { sampleDays?: Day[] }

export function CalendarCard({ calendar }: { calendar: CalendarWithDays }) {
  const href = calendarHref(calendar)
  const label = `${calendar.year} ${monthName(calendar.month)}`
  const hasImages =
    calendar.status === 'generated' ||
    calendar.status === 'composed' ||
    calendar.status === 'exported'

  return (
    <article className="calendar-card">
      <Link href={href} className="calendar-card-link">
        <header className="calendar-card-header">
          <span className="calendar-card-label">{label}</span>
          <span className={`badge badge-${calendar.status}`}>
            {STATUS_LABELS[calendar.status]}
          </span>
        </header>

        {hasImages && calendar.sampleDays && calendar.sampleDays.length > 0 ? (
          <div className="calendar-card-thumbnails">
            {calendar.sampleDays.map((day) => {
              const img = day.image as Media | null
              return img?.url ? (
                <img
                  key={day.id}
                  src={img.url}
                  alt={`Dzień ${day.day}`}
                  className="calendar-card-thumb"
                  width={80}
                  height={80}
                />
              ) : null
            })}
          </div>
        ) : hasImages ? (
          <p className="calendar-card-pending">Generowanie w toku…</p>
        ) : null}
      </Link>
    </article>
  )
}
