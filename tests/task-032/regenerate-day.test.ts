import { beforeAll, describe, expect, it, vi } from 'vitest'
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import { waitForApp } from '../helpers/app'

// Hoistowane mocki — muszą być przed vi.mock()
const mockGetCurrentUser = vi.hoisted(() => vi.fn())
const mockQueueAdd = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'mock-bull-job-123' }))

// Vitest nie zna aliasu @payload-config — przekieruj na faktyczny plik
vi.mock('@payload-config', async () => {
  const mod = await import('../../src/payload.config')
  return mod
})

// Mock getCurrentUser — eliminuje potrzebę weryfikacji ciasteczka
vi.mock('@/lib/auth/current-user', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

// Mock BullMQ queue — eliminuje potrzebę połączenia z Redis z poziomu server action
vi.mock('@/lib/queue/queues', () => ({
  singleImageQueue: { add: mockQueueAdd },
  researchQueue: { add: vi.fn() },
  imagesQueue: { add: vi.fn() },
  pdfQueue: { add: vi.fn() },
  enqueueResearch: vi.fn(),
  enqueueImages: vi.fn(),
  enqueueSingleImage: vi.fn(),
  enqueuePdf: vi.fn(),
}))

// next/cache no-op
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { regenerateDay } from '../../src/app/(app)/kalendarz/[id]/obrazki/actions'

describe('task-032: regenerateDay server action', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>
  let calendarId: number
  let dayId: number
  let userId: number

  beforeAll(async () => {
    await waitForApp()
    payload = await getPayload({ config: configPromise })

    const now = new Date().toISOString()
    const user = await payload.db.create({
      collection: 'users',
      data: {
        email: `test-regen-${Date.now()}@example.com`,
        role: 'user',
        updatedAt: now,
        createdAt: now,
      },
    })
    userId = user.id as number

    const calendar = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: userId,
        year: 2026,
        month: 3,
        status: 'generated',
        updatedAt: now,
        createdAt: now,
      },
    })
    calendarId = calendar.id as number

    const day = await payload.db.create({
      collection: 'days',
      data: {
        calendar: calendarId,
        day: 1,
        occasion: 'Testowa okazja',
        motif: 'Testowy motyw',
        prompt: 'Istniejący prompt dnia',
        status: 'generated',
        updatedAt: now,
        createdAt: now,
      },
    })
    dayId = day.id as number
  })

  it('zwraca błąd gdy brak autoryzacji', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null)
    const result = await regenerateDay(dayId)
    expect(result.error).toBeTruthy()
    expect(result.jobId).toBeUndefined()
  })

  it('enqueuje job i zwraca jobId dla zalogowanego właściciela', async () => {
    mockGetCurrentUser.mockResolvedValueOnce({ id: userId, role: 'user', email: 'x@x.com' })
    const result = await regenerateDay(dayId, 'Nowy prompt testowy')
    expect(result.error).toBeUndefined()
    expect(result.jobId).toBe('mock-bull-job-123')
    expect(mockQueueAdd).toHaveBeenCalledWith(
      'single-image',
      expect.objectContaining({ dayId: String(dayId), newPrompt: 'Nowy prompt testowy' }),
      expect.any(Object),
    )
  })

  it('blokuje regenerację po osiągnięciu limitu 20', async () => {
    const now = new Date().toISOString()
    // Utwórz 20 nie-failed single-image jobów dla tego kalendarza
    for (let i = 0; i < 20; i++) {
      await payload.db.create({
        collection: 'generation-jobs',
        data: {
          calendar: calendarId,
          type: 'single-image',
          status: 'completed',
          startedAt: now,
          completedAt: now,
          updatedAt: now,
          createdAt: now,
        },
      })
    }

    mockGetCurrentUser.mockResolvedValueOnce({ id: userId, role: 'user', email: 'x@x.com' })
    const result = await regenerateDay(dayId)
    expect(result.error).toMatch(/limit/i)
    expect(result.jobId).toBeUndefined()
  })
})
