'use client'

import React, { useState } from 'react'
import { createCalendar } from './actions'

const MONTHS = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
]

const CURRENT_YEAR = new Date().getFullYear()

export default function NowyKalendarzPage() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleMonthClick(monthIndex: number) {
    setSelectedMonth(monthIndex + 1)
    setError(null)
    setLoading(true)
    try {
      const result = await createCalendar(year, monthIndex + 1)
      if (result?.error) {
        setError(result.error)
        setSelectedMonth(null)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-content">
      <div className="page-header">
        <h1>Nowy kalendarz</h1>
      </div>

      <div className="creator-card">
        <div className="year-selector">
          <label htmlFor="year-select" className="year-label">
            Rok
          </label>
          <select
            id="year-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="year-select"
            disabled={loading}
          >
            <option value={CURRENT_YEAR}>{CURRENT_YEAR}</option>
            <option value={CURRENT_YEAR + 1}>{CURRENT_YEAR + 1}</option>
          </select>
        </div>

        {error && (
          <div className="creator-error" role="alert">
            {error}
          </div>
        )}

        <p className="months-hint">Wybierz miesiąc:</p>
        <div className="months-grid">
          {MONTHS.map((name, i) => (
            <button
              key={i}
              className={`month-btn${selectedMonth === i + 1 ? ' month-btn--active' : ''}`}
              onClick={() => handleMonthClick(i)}
              disabled={loading}
              aria-label={`${name} ${year}`}
            >
              {name}
            </button>
          ))}
        </div>

        {loading && <p className="creator-loading">Tworzę kalendarz…</p>}
      </div>
    </main>
  )
}
