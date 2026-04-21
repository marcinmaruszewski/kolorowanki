import { beforeAll, describe, expect, it, vi } from 'vitest'
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import { waitForApp } from '../helpers/app'

vi.mock('@payload-config', async () => {
  const mod = await import('../../src/payload.config')
  return mod
})

import { countRegenerationsUsed } from '../../src/lib/quota/regenerations'

describe('task-033: countRegenerationsUsed', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>
  let calendarId: number

  beforeAll(async () => {
    await waitForApp()
    payload = await getPayload({ config: configPromise })

    const now = new Date().toISOString()

    const user = await payload.db.create({
      collection: 'users',
      data: {
        email: `t033-${Date.now()}@example.com`,
        role: 'user',
        updatedAt: now,
        createdAt: now,
      },
    })

    const calendar = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: user.id as number,
        year: 2025,
        month: 5,
        status: 'generated',
        updatedAt: now,
        createdAt: now,
      },
    })
    calendarId = calendar.id as number

    // 3 completed single-image jobs (should count)
    for (let i = 0; i < 3; i++) {
      await payload.db.create({
        collection: 'generation-jobs',
        data: {
          calendar: calendarId,
          type: 'single-image',
          status: 'completed',
          updatedAt: now,
          createdAt: now,
        },
      })
    }
    // 1 failed single-image (should NOT count)
    await payload.db.create({
      collection: 'generation-jobs',
      data: {
        calendar: calendarId,
        type: 'single-image',
        status: 'failed',
        updatedAt: now,
        createdAt: now,
      },
    })
    // 1 images-batch job (type !== single-image, should NOT count)
    await payload.db.create({
      collection: 'generation-jobs',
      data: {
        calendar: calendarId,
        type: 'images',
        status: 'completed',
        updatedAt: now,
        createdAt: now,
      },
    })
  })

  it('counts only non-failed single-image jobs', async () => {
    const count = await countRegenerationsUsed(calendarId)
    expect(count).toBe(3)
  })

  it('returns 0 for calendar with no single-image jobs', async () => {
    const now = new Date().toISOString()
    const user2 = await payload.db.create({
      collection: 'users',
      data: {
        email: `t033b-${Date.now()}@example.com`,
        role: 'user',
        updatedAt: now,
        createdAt: now,
      },
    })
    const cal2 = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: user2.id as number,
        year: 2025,
        month: 6,
        status: 'generated',
        updatedAt: now,
        createdAt: now,
      },
    })
    const count = await countRegenerationsUsed(cal2.id as number)
    expect(count).toBe(0)
  })
})
