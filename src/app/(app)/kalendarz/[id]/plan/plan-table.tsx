import React from 'react'
import type { Day } from '@/payload-types'

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
}

export function PlanTable({ days, year, month }: PlanTableProps) {
  const sorted = [...days].sort((a, b) => a.day - b.day)

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
              <td>{d.occasion ?? '—'}</td>
              <td>{d.motif ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
