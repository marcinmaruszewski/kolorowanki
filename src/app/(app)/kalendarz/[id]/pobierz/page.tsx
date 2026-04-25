'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type JobStatus = 'queued' | 'submitted' | 'in-progress' | 'completed' | 'failed' | 'cancelled'

interface JobInfo {
  status: JobStatus
  errorLog?: string | null
}

const STATUS_LABELS: Record<JobStatus, string> = {
  queued: 'Oczekuje w kolejce…',
  submitted: 'Wysłano do generatora…',
  'in-progress': 'Generowanie PDF…',
  completed: 'PDF gotowy!',
  failed: 'Błąd generowania',
  cancelled: 'Anulowano',
}

const DONE_STATUSES: JobStatus[] = ['completed', 'failed', 'cancelled']

export default function PobierzPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const calendarId = params.id
  const jobId = searchParams.get('job')

  const [job, setJob] = useState<JobInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return

    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/generation-jobs/${jobId}`)
        if (!res.ok) {
          setError('Nie udało się pobrać statusu zadania.')
          return
        }
        const data = (await res.json()) as JobInfo
        if (!cancelled) {
          setJob(data)
          if (!DONE_STATUSES.includes(data.status)) {
            setTimeout(poll, 3000)
          }
        }
      } catch {
        if (!cancelled) setError('Błąd sieci — spróbuj odświeżyć stronę.')
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [jobId])

  if (!jobId) {
    return (
      <main className="page-content">
        <h1>Pobierz PDF</h1>
        <p>Brak identyfikatora zadania. Wróć do edytora i kliknij „Pobierz PDF".</p>
        <Link href={`/kalendarz/${calendarId}/edytor`} className="btn btn-secondary">
          Wróć do edytora
        </Link>
      </main>
    )
  }

  return (
    <main className="page-content">
      <h1>Pobierz PDF</h1>

      {error && <p className="error-msg">{error}</p>}

      {!job && !error && <p>Ładowanie statusu…</p>}

      {job && (
        <div className="pobierz-status">
          <p className="pobierz-status-label">{STATUS_LABELS[job.status] ?? job.status}</p>

          {job.status === 'completed' && (
            <a
              href={`/api/kalendarz/${calendarId}/pdf`}
              download
              className="btn btn-primary pobierz-btn"
            >
              Pobierz PDF
            </a>
          )}

          {job.status === 'failed' && job.errorLog && (
            <pre className="error-log">{job.errorLog}</pre>
          )}

          {!DONE_STATUSES.includes(job.status) && (
            <p className="pobierz-hint">Strona odświeży się automatycznie co 3 sekundy.</p>
          )}

          <div className="pobierz-actions">
            <Link href={`/kalendarz/${calendarId}/edytor`} className="btn btn-secondary">
              Wróć do edytora
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
