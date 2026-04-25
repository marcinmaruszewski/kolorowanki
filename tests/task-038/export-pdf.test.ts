import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPayload = vi.hoisted(() => ({
  findByID: vi.fn(),
  update: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue(mockPayload),
}))

vi.mock('@payload-config', () => ({ default: {} }))

const mockEnqueuePdf = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
vi.mock('@/lib/queue/queues', () => ({
  enqueuePdf: mockEnqueuePdf,
}))

vi.mock('@/lib/auth/current-user', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ id: 1, role: 'user' }),
}))

import { exportPdf } from '../../src/app/(app)/kalendarz/[id]/edytor/actions'

const LAYOUT = { version: '6.0.0', objects: [] }

describe('task-038: exportPdf action', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockPayload.findByID.mockResolvedValue({ id: 42, owner: 1, status: 'generated' })
    mockPayload.update.mockResolvedValue({ id: 42 })
    mockPayload.find.mockResolvedValue({ docs: [] })
    mockPayload.create.mockResolvedValue({ id: 99 })
  })

  it('tworzy generationJob i dodaje do kolejki pdf', async () => {
    const result = await exportPdf(42, LAYOUT)

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'calendars',
        id: 42,
        data: expect.objectContaining({ layoutJson: LAYOUT, status: 'composed' }),
      }),
    )

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'generation-jobs',
        data: expect.objectContaining({ calendar: 42, type: 'pdf', status: 'queued' }),
      }),
    )

    expect(mockEnqueuePdf).toHaveBeenCalledWith('42')
    expect(result).toEqual({ jobId: '99' })
  })

  it('zwraca istniejący job gdy pending/running — idempotentność', async () => {
    mockPayload.find.mockResolvedValue({ docs: [{ id: 55 }] })

    const result = await exportPdf(42, LAYOUT)

    expect(mockPayload.create).not.toHaveBeenCalled()
    expect(mockEnqueuePdf).not.toHaveBeenCalled()
    expect(result).toEqual({ jobId: '55' })
  })

  it('rzuca błąd gdy user nie jest właścicielem kalendarza', async () => {
    mockPayload.findByID.mockResolvedValue({ id: 42, owner: 999, status: 'generated' })

    await expect(exportPdf(42, LAYOUT)).rejects.toThrow('Brak dostępu')
  })

  it('rzuca błąd gdy status kalendarza jest inny niż generated/composed', async () => {
    mockPayload.findByID.mockResolvedValue({ id: 42, owner: 1, status: 'planned' })

    await expect(exportPdf(42, LAYOUT)).rejects.toThrow('Nieprawidłowy status kalendarza')
  })
})
