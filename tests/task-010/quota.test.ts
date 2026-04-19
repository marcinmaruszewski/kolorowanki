import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resetMonthlyQuotasIfFirstOfMonth } from '../../src/jobs/quota-reset-cron'

function makePayload(updateFn = vi.fn().mockResolvedValue({})) {
  return {
    update: updateFn,
  } as any
}

describe('resetMonthlyQuotasIfFirstOfMonth', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resetuje quota gdy jest 1. dzień miesiąca', async () => {
    vi.setSystemTime(new Date('2026-05-01T00:05:00Z'))

    const updateFn = vi.fn().mockResolvedValue({})
    await resetMonthlyQuotasIfFirstOfMonth(makePayload(updateFn))

    expect(updateFn).toHaveBeenCalledOnce()
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        data: expect.objectContaining({ calendarsThisMonth: 0 }),
        overrideAccess: true,
      }),
    )
  })

  it('no-op gdy nie jest 1. dzień miesiąca', async () => {
    vi.setSystemTime(new Date('2026-05-15T00:05:00Z'))

    const updateFn = vi.fn().mockResolvedValue({})
    await resetMonthlyQuotasIfFirstOfMonth(makePayload(updateFn))

    expect(updateFn).not.toHaveBeenCalled()
  })
})

describe('enforceCalendarQuota hook', () => {
  it('rzuca APIError 403 gdy calendarsThisMonth >= 1 i rola user', async () => {
    const { enforceCalendarQuota } = await import('../../src/payload/hooks/enforce-calendar-quota')

    const mockPayload = {
      find: vi.fn().mockResolvedValue({ docs: [{ id: 'user1', calendarsThisMonth: 1 }] }),
      update: vi.fn().mockResolvedValue({}),
    }

    const req: any = {
      user: { id: 'user1', role: 'user' },
      payload: mockPayload,
    }

    await expect(
      enforceCalendarQuota({ operation: 'create', req } as any),
    ).rejects.toThrow('Przekroczono limit 1 kalendarza na miesiąc')
  })

  it('admin omija limit', async () => {
    const { enforceCalendarQuota } = await import('../../src/payload/hooks/enforce-calendar-quota')

    const req: any = {
      user: { id: 'admin1', role: 'admin' },
      payload: { find: vi.fn(), update: vi.fn() },
    }

    await expect(
      enforceCalendarQuota({ operation: 'create', req } as any),
    ).resolves.toBeUndefined()
  })

  it('no-op dla operacji innych niż create', async () => {
    const { enforceCalendarQuota } = await import('../../src/payload/hooks/enforce-calendar-quota')

    const req: any = {
      user: { id: 'user1', role: 'user' },
      payload: { find: vi.fn(), update: vi.fn() },
    }

    await expect(
      enforceCalendarQuota({ operation: 'update', req } as any),
    ).resolves.toBeUndefined()
  })

  it('inkrementuje calendarsThisMonth gdy quota nie przekroczona', async () => {
    const { enforceCalendarQuota } = await import('../../src/payload/hooks/enforce-calendar-quota')

    const updateFn = vi.fn().mockResolvedValue({})
    const mockPayload = {
      find: vi.fn().mockResolvedValue({ docs: [{ id: 'user1', calendarsThisMonth: 0 }] }),
      update: updateFn,
    }

    const req: any = {
      user: { id: 'user1', role: 'user' },
      payload: mockPayload,
    }

    await enforceCalendarQuota({ operation: 'create', req } as any)

    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        id: 'user1',
        data: { calendarsThisMonth: 1 },
        overrideAccess: true,
      }),
    )
  })
})
