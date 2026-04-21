'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Day, Media } from '@/payload-types'
import { RegenerateModal } from './regenerate-modal'

interface Props {
  day: Day
}

export function DayTile({ day }: Props) {
  const media = typeof day.image === 'object' && day.image !== null ? (day.image as Media) : null
  const isGenerated = day.status === 'generated' && media?.url
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  function handleDone() {
    setShowModal(false)
    router.refresh()
  }

  return (
    <>
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
        <button
          className="day-tile-regen"
          disabled={!isGenerated}
          onClick={() => setShowModal(true)}
          title={isGenerated ? 'Regeneruj ten dzień' : 'Czeka na wygenerowanie'}
        >
          Regeneruj
        </button>
      </div>

      {showModal && (
        <RegenerateModal day={day} onClose={() => setShowModal(false)} onDone={handleDone} />
      )}
    </>
  )
}
