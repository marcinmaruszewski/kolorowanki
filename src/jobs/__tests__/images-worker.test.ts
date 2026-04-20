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

const mockImagesQueue = vi.hoisted(() => ({ add: vi.fn() }))
vi.mock('../../lib/queue/queues', () => ({
  imagesQueue: mockImagesQueue,
}))

vi.mock('../../lib/openai/image-prompt', () => ({
  buildImagePrompt: vi.fn().mockReturnValue('prompt obrazkowy'),
}))

vi.mock('../../lib/openai/batch', () => ({
  submitBatch: vi.fn(),
  getBatchStatus: vi.fn(),
  downloadBatchResults: vi.fn(),
}))

vi.mock('../../lib/openai/client', () => ({
  IMAGE_MODEL: 'gpt-image-1.5',
}))

import { processImagesJob } from '../images-worker'
import { submitBatch, getBatchStatus, downloadBatchResults } from '../../lib/openai/batch'

function makeJob(data: Record<string, unknown>): Job {
  return { id: 'job-1', data } as unknown as Job
}

// Minimalny PNG 1x1 w base64
const FAKE_PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const SAMPLE_DAYS = [
  { id: 10, day: 1, occasion: 'Dzień Pracy', motif: 'Flaga', status: 'planned' },
  { id: 11, day: 2, occasion: null, motif: 'Kwiatek', status: 'planned' },
]

const SAMPLE_CALENDAR = { id: 5, year: 2026, month: 5, seriesDirection: null }

beforeEach(() => {
  vi.clearAllMocks()
  mockPayload.create.mockResolvedValue({ id: '99' })
  mockPayload.findByID.mockResolvedValue(SAMPLE_CALENDAR)
  mockPayload.update.mockResolvedValue({})
  mockPayload.find.mockResolvedValue({ docs: SAMPLE_DAYS })
  mockImagesQueue.add.mockResolvedValue({})
})

describe('processImagesJob — faza submit', () => {
  it('pobiera dni, tworzy generationJob, submituje batch i kolejkuje polling', async () => {
    vi.mocked(submitBatch).mockResolvedValue({ batchId: 'batch-img-1' })

    await processImagesJob(makeJob({ calendarId: '5' }))

    expect(mockPayload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'calendars', id: 5 }),
    )
    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'days' }),
    )
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        data: expect.objectContaining({ type: 'images', status: 'queued' }),
      }),
    )
    expect(submitBatch).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: '/v1/images/generations' }),
    )
    expect(mockImagesQueue.add).toHaveBeenCalledWith(
      'images',
      expect.objectContaining({ batchId: 'batch-img-1' }),
      expect.objectContaining({ delay: 60_000 }),
    )
  })

  it('request body zawiera size, quality i response_format', async () => {
    vi.mocked(submitBatch).mockResolvedValue({ batchId: 'batch-img-2' })

    await processImagesJob(makeJob({ calendarId: '5' }))

    const call = vi.mocked(submitBatch).mock.calls[0][0]
    const body = call.requests[0].body
    expect(body).toMatchObject({
      size: '1024x1024',
      quality: 'medium',
      response_format: 'b64_json',
    })
  })
})

describe('processImagesJob — faza poll (in_progress)', () => {
  it('re-kolejkuje polling gdy batch jeszcze trwa', async () => {
    vi.mocked(getBatchStatus).mockResolvedValue({
      status: 'in_progress',
      outputFileId: null,
      errorFileId: null,
    })

    await processImagesJob(makeJob({ calendarId: '5', generationJobId: '99', batchId: 'batch-img-1' }))

    expect(mockImagesQueue.add).toHaveBeenCalledWith(
      'images',
      expect.objectContaining({ batchId: 'batch-img-1' }),
      expect.objectContaining({ delay: 60_000 }),
    )
    expect(mockPayload.update).not.toHaveBeenCalled()
  })
})

describe('processImagesJob — faza poll (failed)', () => {
  it('oznacza generationJob jako failed gdy batch się nie udał', async () => {
    vi.mocked(getBatchStatus).mockResolvedValue({
      status: 'failed',
      outputFileId: null,
      errorFileId: null,
    })

    await expect(
      processImagesJob(makeJob({ calendarId: '5', generationJobId: '99', batchId: 'batch-img-1' })),
    ).rejects.toThrow('batch-img-1')

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        data: expect.objectContaining({ status: 'failed' }),
      }),
    )
  })
})

describe('processImagesJob — faza poll (completed)', () => {
  it('zapisuje media i aktualizuje days + calendar + generationJob', async () => {
    vi.mocked(getBatchStatus).mockResolvedValue({
      status: 'completed',
      outputFileId: 'file-out-1',
      errorFileId: null,
    })
    vi.mocked(downloadBatchResults).mockResolvedValue([
      {
        custom_id: 'day-5-1',
        response: {
          status_code: 200,
          body: { data: [{ b64_json: FAKE_PNG_B64 }] },
        },
      },
      {
        custom_id: 'day-5-2',
        response: {
          status_code: 200,
          body: { data: [{ b64_json: FAKE_PNG_B64 }] },
        },
      },
    ])

    // find() kolejno zwraca po jednym dniu
    mockPayload.find
      .mockResolvedValueOnce({ docs: [SAMPLE_DAYS[0]] })
      .mockResolvedValueOnce({ docs: [SAMPLE_DAYS[1]] })
    mockPayload.create.mockResolvedValue({ id: 'media-1' })

    await processImagesJob(makeJob({ calendarId: '5', generationJobId: '99', batchId: 'batch-img-1' }))

    // media powinno być stworzone 2x
    const mediaCalls = vi.mocked(mockPayload.create).mock.calls.filter(
      (c) => c[0].collection === 'media',
    )
    expect(mediaCalls).toHaveLength(2)
    expect(mediaCalls[0][0].data).toMatchObject({ alt: 'Dzień 1', calendar: 5 })

    // days powinny mieć status generated
    const dayCalls = vi.mocked(mockPayload.update).mock.calls.filter(
      (c) => c[0].collection === 'days',
    )
    expect(dayCalls).toHaveLength(2)
    expect(dayCalls[0][0].data).toMatchObject({ status: 'generated' })

    // calendar status = generated
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'calendars',
        data: { status: 'generated' },
      }),
    )

    // generationJob completed
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        data: expect.objectContaining({ status: 'completed' }),
      }),
    )
  })

  it('częściowy fail — failed day oznaczony, kalendarz nadal generated', async () => {
    vi.mocked(getBatchStatus).mockResolvedValue({
      status: 'completed',
      outputFileId: 'file-out-2',
      errorFileId: null,
    })
    vi.mocked(downloadBatchResults).mockResolvedValue([
      {
        custom_id: 'day-5-1',
        response: { status_code: 200, body: { data: [{ b64_json: FAKE_PNG_B64 }] } },
      },
      {
        custom_id: 'day-5-2',
        response: { status_code: 400, body: { error: 'content policy' } },
      },
    ])

    mockPayload.find
      .mockResolvedValueOnce({ docs: [SAMPLE_DAYS[0]] })
      .mockResolvedValueOnce({ docs: [SAMPLE_DAYS[1]] })

    await processImagesJob(makeJob({ calendarId: '5', generationJobId: '99', batchId: 'batch-img-2' }))

    const dayCalls = vi.mocked(mockPayload.update).mock.calls.filter(
      (c) => c[0].collection === 'days',
    )
    const failedCall = dayCalls.find((c) => c[0].data?.status === 'failed')
    expect(failedCall).toBeDefined()

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'calendars',
        data: { status: 'generated' },
      }),
    )
  })
})
