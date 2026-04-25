import React from 'react'
import type { AdminViewServerProps } from 'payload'
import type { Calendar, GenerationJob } from '@/payload-types'

export const CostDashboard = async ({ payload, user }: AdminViewServerProps) => {
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Brak dostępu. Ta strona jest dostępna tylko dla administratorów.</p>
      </div>
    )
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const result = await payload.find({
    collection: 'generation-jobs',
    limit: 1000,
    where: { createdAt: { greater_than_equal: startOfMonth.toISOString() } },
    depth: 1,
  })

  const jobs = result.docs as GenerationJob[]

  const totalCost = jobs.reduce((sum, j) => sum + (j.costUsd ?? 0), 0)

  const byType: Record<string, number> = { research: 0, images: 0, 'single-image': 0, pdf: 0 }
  for (const job of jobs) {
    if (job.type in byType) byType[job.type] += job.costUsd ?? 0
  }

  const calMap: Record<string, { label: string; cost: number }> = {}
  for (const job of jobs) {
    const cal = typeof job.calendar === 'object' ? (job.calendar as Calendar) : null
    const calId = String(typeof job.calendar === 'number' ? job.calendar : cal?.id)
    const calLabel = cal?.label ?? `Kalendarz #${calId}`
    if (!calMap[calId]) calMap[calId] = { label: calLabel, cost: 0 }
    calMap[calId].cost += job.costUsd ?? 0
  }
  const top5 = Object.values(calMap)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5)

  const monthLabel = now.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '2rem', fontFamily: 'inherit', maxWidth: '640px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        Koszty OpenAI
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem', textTransform: 'capitalize' }}>
        {monthLabel}
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '0.5rem' }}>
          Łączny koszt w bieżącym miesiącu
        </h2>
        <p style={{ fontSize: '2.25rem', fontWeight: 700 }}>${totalCost.toFixed(4)}</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '0.75rem' }}>
          Podział według typu
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>Typ</th>
              <th style={{ textAlign: 'right', padding: '0.4rem 0.6rem', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>Koszt (USD)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byType).map(([type, cost]) => (
              <tr key={type}>
                <td style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid #f3f4f6' }}>{type}</td>
                <td style={{ textAlign: 'right', padding: '0.4rem 0.6rem', borderBottom: '1px solid #f3f4f6' }}>
                  ${cost.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {top5.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '0.75rem' }}>
            Top 5 kalendarzy (koszt)
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>Kalendarz</th>
                <th style={{ textAlign: 'right', padding: '0.4rem 0.6rem', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>Koszt (USD)</th>
              </tr>
            </thead>
            <tbody>
              {top5.map((entry) => (
                <tr key={entry.label}>
                  <td style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid #f3f4f6' }}>{entry.label}</td>
                  <td style={{ textAlign: 'right', padding: '0.4rem 0.6rem', borderBottom: '1px solid #f3f4f6' }}>
                    ${entry.cost.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {jobs.length === 0 && (
        <p style={{ color: '#9ca3af', marginTop: '1rem' }}>
          Brak zadań generacyjnych w bieżącym miesiącu.
        </p>
      )}
    </div>
  )
}
