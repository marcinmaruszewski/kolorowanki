import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Job } from 'bullmq'

const mockPayload = vi.hoisted(() => ({
  create: vi.fn(),
  findByID: vi.fn(),
  update: vi.fn(),
  find: vi.fn(),
  delete: vi.fn(),
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

const mockOpenai = vi.hoisted(() => ({
  images: {
    generate: vi.fn(),
  },
}))

vi.mock('../../lib/openai/client', () => ({
  openai: mockOpenai,
  IMAGE_MODEL: 'gpt-image-1.5',
}))

vi.mock('../../lib/openai/image-prompt', () => ({
  buildImagePrompt: vi.fn().mockReturnValue('prompt testowy'),
}))

import { processSingleImageJob } from '../single-image-worker'

// Minimalny PNG 1x1 w base64
const FAKE_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const SAMPLE_DAY = { id: 10, day: 5, occasion: 'Dzień Dziecka', motif: 'Balony', status: 'generated', image: 77, calendar: 3 }
const SAMPLE_CALENDAR = { id: 3, year: 2026, month: 6, seriesDirection: null }

function makeJob(data: Record<string, unknown>): Job {
  return { id: 'job-1', data } as unknown as Job
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPayload.findByID.mockImplementation(({ collection }: { collection: string }) => {
    if (collection === 'days') return Promise.resolve(SAMPLE_DAY)
    if (collection === 'calendars') return Promise.resolve(SAMPLE_CALENDAR)
    return Promise.resolve({})
  })
  mockPayload.find.mockResolvedValue({ totalDocs: 0, docs: [] })
  mockPayload.create.mockResolvedValue({ id: 'media-99' })
  mockPayload.update.mockResolvedValue({})
  mockPayload.delete.mockResolvedValue({})
  mockOpenai.images.generate.mockResolvedValue({
    data: [{ b64_json: FAKE_PNG_B64 }],
  })
})

describe('processSingleImageJob', () => {
  it('generuje obraz, usuwa stary media, tworzy nowy i aktualizuje day', async () => {
    await processSingleImageJob(makeJob({ dayId: '10' }))

    expect(mockOpenai.images.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-image-1.5',
        size: '1024x1024',
        quality: 'medium',
        response_format: 'b64_json',
      }),
    )

    // Usuwa stary media
    expect(mockPayload.delete).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'media', id: 77 }),
    )

    // Tworzy nowy media
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        data: expect.objectContaining({ alt: 'Dzień 5', calendar: 3 }),
      }),
    )

    // Aktualizuje day
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'days',
        id: 10,
        data: expect.objectContaining({ status: 'generated', image: 'media-99' }),
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

  it('używa newPrompt jeśli podany zamiast buildImagePrompt', async () => {
    const { buildImagePrompt } = await import('../../lib/openai/image-prompt')

    await processSingleImageJob(makeJob({ dayId: '10', newPrompt: 'custom prompt' }))

    expect(vi.mocked(buildImagePrompt)).not.toHaveBeenCalled()
    expect(mockOpenai.images.generate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'custom prompt' }),
    )
  })

  it('nie usuwa starego media gdy day.image jest puste', async () => {
    mockPayload.findByID.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'days') return Promise.resolve({ ...SAMPLE_DAY, image: null })
      if (collection === 'calendars') return Promise.resolve(SAMPLE_CALENDAR)
      return Promise.resolve({})
    })

    await processSingleImageJob(makeJob({ dayId: '10' }))

    expect(mockPayload.delete).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'media' }),
    )
  })

  it('rzuca błąd i zapisuje failed job gdy limit >=20 osiągnięty', async () => {
    mockPayload.find.mockResolvedValue({ totalDocs: 20, docs: [] })

    await expect(processSingleImageJob(makeJob({ dayId: '10' }))).rejects.toThrow(
      'Limit regeneracji (20)',
    )

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        data: expect.objectContaining({ status: 'failed', type: 'single-image' }),
      }),
    )

    // Nie powinno wołać OpenAI
    expect(mockOpenai.images.generate).not.toHaveBeenCalled()
  })

  it('rzuca błąd gdy OpenAI nie zwraca b64_json', async () => {
    mockOpenai.images.generate.mockResolvedValue({ data: [{}] })

    await expect(processSingleImageJob(makeJob({ dayId: '10' }))).rejects.toThrow(
      'Brak b64_json',
    )

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        data: expect.objectContaining({ status: 'failed' }),
      }),
    )
  })
})
