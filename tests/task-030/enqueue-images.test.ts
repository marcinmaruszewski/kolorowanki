import { beforeAll, describe, expect, it, vi } from 'vitest'
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import { waitForApp } from '../helpers/app'

vi.mock('@payload-config', async () => {
  const mod = await import('../../src/payload.config')
  return mod
})

vi.mock('../../src/lib/openai/client', () => ({
  openai: {},
  TEXT_MODEL: 'gpt-5.4',
  IMAGE_MODEL: 'gpt-image-1.5',
}))

vi.mock('../../src/lib/openai/image-prompt', () => ({
  buildImagePrompt: vi.fn().mockReturnValue('mocked prompt'),
}))

const mockSubmitBatch = vi.hoisted(() => vi.fn().mockResolvedValue({ batchId: 'batch-test-123' }))

vi.mock('../../src/lib/openai/batch', () => ({
  submitBatch: mockSubmitBatch,
  getBatchStatus: vi.fn(),
  downloadBatchResults: vi.fn(),
}))

// Mock BullMQ — nie potrzebujemy Redisa w teście
vi.mock('../../src/lib/queue/queues', () => ({
  imagesQueue: { add: vi.fn().mockResolvedValue(undefined) },
  researchQueue: { add: vi.fn() },
  singleImageQueue: { add: vi.fn() },
  pdfQueue: { add: vi.fn() },
  enqueueResearch: vi.fn(),
  enqueueImages: vi.fn(),
  enqueueSingleImage: vi.fn(),
  enqueuePdf: vi.fn(),
}))

import { enqueueImagesBatch } from '../../src/jobs/enqueue-images'

describe('task-030: enqueueImagesBatch', () => {
  beforeAll(async () => {
    await waitForApp()
  })

  it('wysyła tyle requestów ile dni w kalendarzu', async () => {
    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()
    const DAY_COUNT = 5

    const user = await payload.db.create({
      collection: 'users',
      data: {
        email: `test-030-enqueue-${Date.now()}@example.com`,
        role: 'user',
        updatedAt: now,
        createdAt: now,
      },
    })

    const calendar = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: user.id,
        year: 2026,
        month: 5,
        status: 'draft',
        updatedAt: now,
        createdAt: now,
      },
    })

    for (let i = 1; i <= DAY_COUNT; i++) {
      await payload.db.create({
        collection: 'days',
        data: {
          calendar: calendar.id,
          day: i,
          motif: `Motyw dnia ${i} długi opis testu`,
          occasion: `Okazja ${i}`,
          updatedAt: now,
          createdAt: now,
        },
      })
    }

    mockSubmitBatch.mockClear()

    await enqueueImagesBatch(calendar.id)

    expect(mockSubmitBatch).toHaveBeenCalledOnce()
    const [callArg] = mockSubmitBatch.mock.calls[0]
    expect(callArg.requests).toHaveLength(DAY_COUNT)
    expect(callArg.endpoint).toBe('/v1/images/generations')

    // Sprawdź że generationJob został stworzony z poprawnym batchId
    const jobs = await payload.find({
      collection: 'generation-jobs',
      where: { calendar: { equals: calendar.id } },
      overrideAccess: true,
    })
    expect(jobs.docs.length).toBeGreaterThanOrEqual(1)
    expect(jobs.docs[0].openaiBatchId).toBe('batch-test-123')
  })
})
