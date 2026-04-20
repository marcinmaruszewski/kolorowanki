'use client'

import React, { useState, useTransition } from 'react'
import type { Day } from '@/payload-types'
import { updateDays } from './actions'

const WEEKDAY_LABEL: Record<string, string> = {
  pon: 'Pon',
  wt: 'Wt',
  śr: 'Śr',
  czw: 'Czw',
  pt: 'Pt',
  sob: 'Sob',
  niedz: 'Niedz',
}

interface PlanTableProps {
  days: Day[]
  year: number
  month: number
  calendarId: number
  editable: boolean
}

interface RowState {
  occasion: string
  motif: string
}

export function PlanTable({ days, year, month, calendarId, editable }: PlanTableProps) {
  const sorted = [...days].sort((a, b) => a.day - b.day)

  const [rows, setRows] = useState<Record<number, RowState>>(() => {
    const init: Record<number, RowState> = {}
    for (const d of sorted) {
      init[d.id] = { occasion: d.occasion ?? '', motif: d.motif ?? '' }
    }
    return init
  })

  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isDirty = sorted.some((d) => {
    const r = rows[d.id]
    return r.occasion !== (d.occasion ?? '') || r.motif !== (d.motif ?? '')
  })

  function handleChange(id: number, field: keyof RowState, value: string) {
    setSaved(false)
    setError(null)
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  function handleSave() {
    const updates = sorted.map((d) => ({
      id: d.id,
      occasion: rows[d.id].occasion,
      motif: rows[d.id].motif,
    }))
    setError(null)
    startTransition(async () => {
      const result = await updateDays(calendarId, updates)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="plan-table-wrap">
      <table className="plan-table">
        <thead>
          <tr>
            <th>Dzień</th>
            <th>Okazja</th>
            <th>Motyw</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr key={d.id}>
              <td className="plan-day-cell">
                <span className="plan-day-num">{d.day}</span>
                {d.weekday && (
                  <span className="plan-day-wd">{WEEKDAY_LABEL[d.weekday] ?? d.weekday}</span>
                )}
                <span className="plan-day-date">
                  {String(d.day).padStart(2, '0')}.{String(month).padStart(2, '0')}.{year}
                </span>
              </td>
              <td>
                {editable ? (
                  <input
                    className="plan-input"
                    type="text"
                    value={rows[d.id].occasion}
                    maxLength={200}
                    onChange={(e) => handleChange(d.id, 'occasion', e.target.value)}
                  />
                ) : (
                  d.occasion ?? '—'
                )}
              </td>
              <td>
                {editable ? (
                  <input
                    className="plan-input"
                    type="text"
                    value={rows[d.id].motif}
                    maxLength={300}
                    onChange={(e) => handleChange(d.id, 'motif', e.target.value)}
                  />
                ) : (
                  d.motif ?? '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editable && (
        <div className="plan-save-bar">
          {error && <p className="plan-error">{error}</p>}
          {saved && !isDirty && <p className="plan-saved">Zapisano.</p>}
          <button
            className="btn btn-secondary"
            onClick={handleSave}
            disabled={!isDirty || isPending}
          >
            {isPending ? 'Zapisywanie…' : 'Zapisz zmiany'}
          </button>
        </div>
      )}
    </div>
  )
}
