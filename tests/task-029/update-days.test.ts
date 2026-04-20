import { beforeAll, describe, expect, it, vi } from 'vitest'
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import { waitForApp } from '../helpers/app'

// Hoistowane mocki — muszą być przed vi.mock()
const mockGetCurrentUser = vi.hoisted(() => vi.fn())

// Vitest nie zna aliasu @payload-config — przekieruj na faktyczny plik
vi.mock('@payload-config', async () => {
  const mod = await import('../../src/payload.config')
  return mod
})

// Mock getCurrentUser — eliminuje potrzebę weryfikacji ciasteczka
vi.mock('@/lib/auth/current-user', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

// revalidatePath jest no-op w środowisku testowym
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { updateDays } from '../../src/app/(app)/kalendarz/[id]/plan/actions'

describe('task-029: updateDays server action', () => {
  beforeAll(async () => {
    await waitForApp()
  })

  it('blokuje zapis dla kalendarza ze statusem generated', async () => {
    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()

    const user = await payload.db.create({
      collection: 'users',
      data: {
        email: `test-029-gen-${Date.now()}@example.com`,
        role: 'user',
        updatedAt: now,
        createdAt: now,
      },
    })

    mockGetCurrentUser.mockResolvedValueOnce({ id: user.id, role: 'user' })

    const calendar = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: user.id,
        year: 2026,
        month: 10,
        status: 'generated',
        updatedAt: now,
        createdAt: now,
      },
    })

    const day = await payload.db.create({
      collection: 'days',
      data: {
        calendar: calendar.id,
        day: 1,
        occasion: 'Stara okazja',
        motif: 'Stary motyw bardzo długi',
        updatedAt: now,
        createdAt: now,
      },
    })

    const result = await updateDays(calendar.id, [
      { id: day.id, occasion: 'Nowa okazja', motif: 'Nowy motyw bardzo długi' },
    ])

    expect(result.error).toBeTruthy()
    expect(result.error).toContain('wygenerowaniu')
  })

  it('aktualizuje dni dla kalendarza ze statusem draft', async () => {
    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()

    const user = await payload.db.create({
      collection: 'users',
      data: {
        email: `test-029-draft-${Date.now()}@example.com`,
        role: 'user',
        updatedAt: now,
        createdAt: now,
      },
    })

    mockGetCurrentUser.mockResolvedValueOnce({ id: user.id, role: 'user' })

    const calendar = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: user.id,
        year: 2026,
        month: 11,
        status: 'draft',
        updatedAt: now,
        createdAt: now,
      },
    })

    const day = await payload.db.create({
      collection: 'days',
      data: {
        calendar: calendar.id,
        day: 1,
        occasion: 'Pierwotna okazja',
        motif: 'Pierwotny motyw opis długi',
        updatedAt: now,
        createdAt: now,
      },
    })

    const result = await updateDays(calendar.id, [
      { id: day.id, occasion: 'Nowa okazja', motif: 'Nowy motyw nowe słowa' },
    ])

    expect(result.error).toBeUndefined()

    const updated = await payload.findByID({
      collection: 'days',
      id: day.id,
      overrideAccess: true,
    })
    expect(updated.occasion).toBe('Nowa okazja')
    expect(updated.motif).toBe('Nowy motyw nowe słowa')
  })

  it('odrzuca motyw krótszy niż 10 znaków', async () => {
    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()

    const user = await payload.db.create({
      collection: 'users',
      data: {
        email: `test-029-val-${Date.now()}@example.com`,
        role: 'user',
        updatedAt: now,
        createdAt: now,
      },
    })

    mockGetCurrentUser.mockResolvedValueOnce({ id: user.id, role: 'user' })

    const calendar = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: user.id,
        year: 2026,
        month: 12,
        status: 'draft',
        updatedAt: now,
        createdAt: now,
      },
    })

    const day = await payload.db.create({
      collection: 'days',
      data: {
        calendar: calendar.id,
        day: 1,
        motif: 'Jakiś opis',
        updatedAt: now,
        createdAt: now,
      },
    })

    const result = await updateDays(calendar.id, [
      { id: day.id, occasion: '', motif: 'za krótki' },
    ])

    expect(result.error).toBeTruthy()
  })
})
