import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Job } from 'bullmq'

const mockPayload = vi.hoisted(() => ({
  create: vi.fn(),
  findByID: vi.fn(),
  update: vi.fn(),
  find: vi.fn(),
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

const mockResearchQueue = vi.hoisted(() => ({ add: vi.fn() }))
vi.mock('../../lib/queue/queues', () => ({
  researchQueue: mockResearchQueue,
}))

vi.mock('../../lib/openai/research', () => ({
  buildResearchPrompt: vi.fn().mockReturnValue('prompt testowy'),
  parseMonthPlan: vi.fn(),
}))

vi.mock('../../lib/openai/batch', () => ({
  submitBatch: vi.fn(),
  getBatchStatus: vi.fn(),
  downloadBatchResults: vi.fn(),
}))

vi.mock('../../lib/openai/client', () => ({
  TEXT_MODEL: 'gpt-5.4',
  IMAGE_MODEL: 'gpt-image-1.5',
}))

import { processResearchJob } from '../research-worker'
import { submitBatch, getBatchStatus, downloadBatchResults } from '../../lib/openai/batch'
import { parseMonthPlan } from '../../lib/openai/research'

function makeJob(data: Record<string, unknown>): Job {
  return { id: 'job-1', data } as unknown as Job
}

const SAMPLE_PLAN = {
  year: 2026,
  month: 5,
  daysInMonth: 2,
  days: [
    { day: 1, weekday: 'czw', occasion: 'Święto Pracy', motif: 'Flaga', sources: ['https://gov.pl/1'] },
    { day: 2, weekday: 'pt', occasion: null, motif: 'Wiosenny kwiatek', sources: [] },
  ],
  seriesNotes: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPayload.create.mockResolvedValue({ id: '42' })
  mockPayload.findByID.mockResolvedValue({ year: 2026, month: 5 })
  mockPayload.update.mockResolvedValue({})
  mockPayload.find.mockResolvedValue({ docs: [] })
  mockResearchQueue.add.mockResolvedValue({})
})

describe('processResearchJob — faza submit', () => {
  it('tworzy generationJob, submituje batch i kolejkuje polling', async () => {
    vi.mocked(submitBatch).mockResolvedValue({ batchId: 'batch-abc' })

    await processResearchJob(makeJob({ calendarId: '1' }))

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        data: expect.objectContaining({ type: 'research', status: 'queued' }),
      }),
    )

    expect(submitBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/v1/responses',
        requests: expect.arrayContaining([
          expect.objectContaining({ custom_id: 'research-1' }),
        ]),
      }),
    )

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        data: expect.objectContaining({ status: 'submitted', openaiBatchId: 'batch-abc' }),
      }),
    )

    expect(mockResearchQueue.add).toHaveBeenCalledWith(
      'research',
      expect.objectContaining({ calendarId: '1', batchId: 'batch-abc' }),
      expect.objectContaining({ delay: 30_000 }),
    )
  })
})

describe('processResearchJob — faza pollingu', () => {
  const pollData = { calendarId: '1', generationJobId: '42', batchId: 'batch-abc' }

  it('re-kolejkuje gdy batch in_progress', async () => {
    vi.mocked(getBatchStatus).mockResolvedValue({
      status: 'in_progress',
      outputFileId: null,
      errorFileId: null,
    })

    await processResearchJob(makeJob(pollData))

    expect(mockResearchQueue.add).toHaveBeenCalledWith(
      'research',
      pollData,
      expect.objectContaining({ delay: 30_000 }),
    )
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('re-kolejkuje gdy batch validating', async () => {
    vi.mocked(getBatchStatus).mockResolvedValue({
      status: 'validating',
      outputFileId: null,
      errorFileId: null,
    })

    await processResearchJob(makeJob(pollData))

    expect(mockResearchQueue.add).toHaveBeenCalledOnce()
  })

  it('zapisuje failed gdy batch failed', async () => {
    vi.mocked(getBatchStatus).mockResolvedValue({
      status: 'failed',
      outputFileId: null,
      errorFileId: 'err-file',
    })

    await expect(processResearchJob(makeJob(pollData))).rejects.toThrow('failed')

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        id: '42',
        data: expect.objectContaining({ status: 'failed' }),
      }),
    )
    expect(mockResearchQueue.add).not.toHaveBeenCalled()
  })

  it('zapisuje failed gdy batch expired', async () => {
    vi.mocked(getBatchStatus).mockResolvedValue({
      status: 'expired',
      outputFileId: null,
      errorFileId: null,
    })

    await expect(processResearchJob(makeJob(pollData))).rejects.toThrow('expired')
  })

  it('happy path: tworzy days, aktualizuje calendar i generationJob', async () => {
    vi.mocked(getBatchStatus).mockResolvedValue({
      status: 'completed',
      outputFileId: 'out-file-1',
      errorFileId: null,
    })

    const planJson = JSON.stringify(SAMPLE_PLAN)
    vi.mocked(downloadBatchResults).mockResolvedValue([
      {
        custom_id: 'research-1',
        response: {
          body: {
            output: [{ content: [{ text: planJson }] }],
            usage: { input_tokens: 1000, output_tokens: 500 },
          },
        },
      },
    ])
    vi.mocked(parseMonthPlan).mockReturnValue(SAMPLE_PLAN as ReturnType<typeof parseMonthPlan>)

    await processResearchJob(makeJob(pollData))

    // Powinien stworzyć 2 rekordy days
    expect(mockPayload.create).toHaveBeenCalledTimes(2)
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'days',
        data: expect.objectContaining({ day: 1, motif: 'Flaga', status: 'planned' }),
      }),
    )

    // Powinien zaktualizować calendar
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'calendars',
        id: 1,
        data: expect.objectContaining({ status: 'planned' }),
      }),
    )

    // Powinien zaktualizować generationJob jako completed
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        id: '42',
        data: expect.objectContaining({
          status: 'completed',
          inputTokens: 1000,
          outputTokens: 500,
        }),
      }),
    )
  })

  it('robi upsert gdy day już istnieje', async () => {
    vi.mocked(getBatchStatus).mockResolvedValue({
      status: 'completed',
      outputFileId: 'out-file-1',
      errorFileId: null,
    })
    vi.mocked(downloadBatchResults).mockResolvedValue([
      {
        custom_id: 'research-1',
        response: {
          body: {
            output: [{ content: [{ text: JSON.stringify(SAMPLE_PLAN) }] }],
            usage: {},
          },
        },
      },
    ])
    vi.mocked(parseMonthPlan).mockReturnValue(SAMPLE_PLAN as ReturnType<typeof parseMonthPlan>)
    // day 1 już istnieje, day 2 nie
    mockPayload.find
      .mockResolvedValueOnce({ docs: [{ id: 'day-existing' }] })
      .mockResolvedValue({ docs: [] })

    await processResearchJob(makeJob(pollData))

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'days', id: 'day-existing' }),
    )
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'days', data: expect.objectContaining({ day: 2 }) }),
    )
  })
})
