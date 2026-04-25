import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import { waitForApp } from '../helpers/app'

vi.mock('@payload-config', async () => {
  const mod = await import('../../src/payload.config')
  return mod
})

import { vi } from 'vitest'

describe('task-037: layoutJson zapis i odczyt', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>
  let calendarId: number

  beforeAll(async () => {
    await waitForApp()
    payload = await getPayload({ config: configPromise })

    const now = new Date().toISOString()

    const user = await payload.db.create({
      collection: 'users',
      data: {
        email: `t037-${Date.now()}@example.com`,
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
        month: 7,
        status: 'generated',
        updatedAt: now,
        createdAt: now,
      },
    })
    calendarId = calendar.id as number
  })

  it('zapisuje layoutJson przez payload.update i odczytuje poprawnie', async () => {
    const layout = { version: '6.0.0', objects: [{ type: 'image', left: 100, top: 50 }] }

    await payload.update({
      collection: 'calendars',
      id: calendarId,
      data: { layoutJson: layout, status: 'composed' },
      overrideAccess: true,
    })

    const updated = await payload.findByID({
      collection: 'calendars',
      id: calendarId,
      overrideAccess: true,
    })

    expect(updated.status).toBe('composed')
    expect(updated.layoutJson).toMatchObject(layout)
  })

  it('nadpisuje layoutJson przy kolejnym zapisie', async () => {
    const layout2 = { version: '6.0.0', objects: [{ type: 'image', left: 200, top: 80 }] }

    await payload.update({
      collection: 'calendars',
      id: calendarId,
      data: { layoutJson: layout2 },
      overrideAccess: true,
    })

    const updated = await payload.findByID({
      collection: 'calendars',
      id: calendarId,
      overrideAccess: true,
    })

    expect((updated.layoutJson as { objects: { left: number }[] }).objects[0].left).toBe(200)
  })
})
