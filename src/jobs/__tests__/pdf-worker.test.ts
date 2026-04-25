import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Job } from 'bullmq'

const mockPayload = vi.hoisted(() => ({
  create: vi.fn(),
  findByID: vi.fn(),
  update: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue(mockPayload),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('../../lib/queue/connection', () => ({
  redisConnection: {},
}))

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(function (this: unknown) {
    (this as { on: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }).on = vi.fn()
    ;(this as { on: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }).close = vi.fn()
  }),
}))

const FAKE_PDF_BUFFER = Buffer.from('%PDF-1.4 fake')

vi.mock('../../lib/pdf/render-calendar', () => ({
  renderCalendarPdf: vi.fn().mockResolvedValue(FAKE_PDF_BUFFER),
}))

import { processPdfJob } from '../pdf-worker'

const SAMPLE_CALENDAR = { id: 5, year: 2026, month: 6 }

function makeJob(data: Record<string, unknown>): Job {
  return { id: 'job-1', data } as unknown as Job
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPayload.findByID.mockResolvedValue(SAMPLE_CALENDAR)
  mockPayload.create.mockResolvedValue({ id: 'media-10' })
  mockPayload.update.mockResolvedValue({})
})

describe('processPdfJob', () => {
  it('renderuje PDF, tworzy media i aktualizuje calendar + generationJob', async () => {
    await processPdfJob(makeJob({ calendarId: '5', generationJobId: 'job-42' }))

    const { renderCalendarPdf } = await import('../../lib/pdf/render-calendar')
    expect(renderCalendarPdf).toHaveBeenCalledWith(5)

    // Tworzy media z buforem PDF
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        file: expect.objectContaining({
          mimetype: 'application/pdf',
          size: FAKE_PDF_BUFFER.length,
        }),
      }),
    )

    // Aktualizuje calendar: pdfFile + status='exported'
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'calendars',
        id: 5,
        data: expect.objectContaining({ pdfFile: 'media-10', status: 'exported' }),
      }),
    )

    // Zamyka generationJob jako completed
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        id: 'job-42',
        data: expect.objectContaining({ status: 'completed' }),
      }),
    )
  })

  it('tworzy generationJob gdy brak generationJobId', async () => {
    mockPayload.create
      .mockResolvedValueOnce({ id: 'gen-99' }) // generationJob
      .mockResolvedValueOnce({ id: 'media-10' }) // media

    await processPdfJob(makeJob({ calendarId: '5' }))

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        data: expect.objectContaining({ type: 'pdf', status: 'queued' }),
      }),
    )
  })

  it('ustawia generationJob.status=failed i rzuca błąd przy błędzie renderowania', async () => {
    const { renderCalendarPdf } = await import('../../lib/pdf/render-calendar')
    vi.mocked(renderCalendarPdf).mockRejectedValueOnce(new Error('pdf error'))

    await expect(processPdfJob(makeJob({ calendarId: '5', generationJobId: 'job-42' }))).rejects.toThrow(
      'pdf error',
    )

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        id: 'job-42',
        data: expect.objectContaining({ status: 'failed', errorLog: expect.stringContaining('pdf error') }),
      }),
    )
  })
})
