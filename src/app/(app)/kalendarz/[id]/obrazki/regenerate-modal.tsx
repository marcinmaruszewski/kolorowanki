'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { regenerateDay } from './actions'
import type { Day, Media } from '@/payload-types'

interface Props {
  day: Day
  onClose: () => void
  onDone: () => void
}

export function RegenerateModal({ day, onClose, onDone }: Props) {
  const media = typeof day.image === 'object' && day.image !== null ? (day.image as Media) : null
  const [prompt, setPrompt] = useState(day.prompt ?? '')
  const [jobId, setJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!jobId) return

    async function poll() {
      try {
        // Payload REST auto-endpoint for generation-jobs; filter by BullMQ job not available,
        // so we poll the generationJobs collection for latest single-image job for this day's calendar
        const calId =
          typeof day.calendar === 'number' ? day.calendar : (day.calendar as { id: number }).id
        const res = await fetch(
          `/api/generation-jobs?where[calendar][equals]=${calId}&where[type][equals]=single-image&where[status][not_equals]=failed&sort=-createdAt&limit=1`,
        )
        if (!res.ok) {
          throw new Error('Błąd odpytywania statusu.')
        }
        const json = await res.json()
        const job = json?.docs?.[0]
        if (job?.status === 'completed') {
          stopPolling()
          onDone()
          return
        }
        if (job?.status === 'failed') {
          stopPolling()
          setError(job.errorLog ?? 'Generowanie nie powiodło się.')
          setSubmitting(false)
          return
        }
      } catch (err) {
        // ignore transient errors, keep polling
        console.error('[regen-poll]', err)
      }
      pollingRef.current = setTimeout(poll, 3_000)
    }

    pollingRef.current = setTimeout(poll, 3_000)
    return stopPolling
  }, [jobId, day.calendar, stopPolling, onDone])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await regenerateDay(day.id, prompt.trim() || undefined)
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }
    setJobId(result.jobId ?? null)
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Regeneruj dzień">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose} disabled={submitting} aria-label="Zamknij">
          ✕
        </button>

        <h2 className="modal-title">Regeneruj — dzień {day.day}</h2>

        {media?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={`Dzień ${day.day}`} className="modal-preview-img" />
        )}

        {submitting ? (
          <div className="modal-spinner" aria-live="polite">
            <span className="spinner" />
            <span>Generowanie… może potrwać kilkanaście sekund.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <label htmlFor="regen-prompt" className="modal-label">
              Prompt obrazka
            </label>
            <textarea
              id="regen-prompt"
              className="modal-textarea"
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Anuluj
              </button>
              <button type="submit" className="btn btn-primary">
                Wygeneruj od nowa
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
