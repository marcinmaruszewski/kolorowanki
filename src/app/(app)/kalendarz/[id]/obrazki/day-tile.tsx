import React from 'react'
import type { Day, Media } from '@/payload-types'

interface Props {
  day: Day
}

export function DayTile({ day }: Props) {
  const media = typeof day.image === 'object' && day.image !== null ? (day.image as Media) : null
  const isGenerated = day.status === 'generated' && media?.url

  return (
    <div className="day-tile">
      <div className="day-tile-number">{day.day}</div>
      {isGenerated ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.url!}
          alt={`Dzień ${day.day}`}
          className="day-tile-img"
          loading="lazy"
        />
      ) : (
        <div className="day-tile-placeholder">
          <span>Generowanie…</span>
        </div>
      )}
      <button className="day-tile-regen" disabled title="Regeneracja (wkrótce)">
        Regeneruj
      </button>
    </div>
  )
}
