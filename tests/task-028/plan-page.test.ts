import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import { devLogin, fetchText, waitForApp } from '../helpers/app'

describe('task-028: plan page', () => {
  beforeAll(async () => {
    await waitForApp()
  })

  it('dla draft bez dni pokazuje placeholder generowania', async () => {
    const email = `test-plan-empty-${Date.now()}@example.com`
    const { cookie, body } = await devLogin(email)
    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()

    const calendar = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: body.userId,
        year: 2026,
        month: 8,
        status: 'draft',
        updatedAt: now,
        createdAt: now,
      },
    })

    const { res, text } = await fetchText(`/kalendarz/${calendar.id}/plan`, {
      headers: { cookie },
    })

    expect(res.status).toBe(200)
    expect(text).toContain('Generujemy plan')
    expect(text).toContain('Strona odświeży się automatycznie')
  })

  it('dla kalendarza z dniami pokazuje tabelę planu', async () => {
    const email = `test-plan-days-${Date.now()}@example.com`
    const { cookie, body } = await devLogin(email)
    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()

    const calendar = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: body.userId,
        year: 2026,
        month: 9,
        status: 'draft',
        updatedAt: now,
        createdAt: now,
      },
    })

    for (let day = 1; day <= 5; day += 1) {
      await payload.db.create({
        collection: 'days',
        data: {
          calendar: calendar.id,
          day,
          occasion: `Okazja ${day}`,
          motif: `Motyw ${day}`,
          updatedAt: now,
          createdAt: now,
        },
      })
    }

    const { res, text } = await fetchText(`/kalendarz/${calendar.id}/plan`, {
      headers: { cookie },
    })

    expect(res.status).toBe(200)
    expect(text).toContain('Dzień')
    expect(text).toContain('Okazja')
    expect(text).toContain('Motyw')
    expect(text).toContain('Okazja 1')
    expect(text).toContain('Motyw 1')
    expect(text).toContain('Wygeneruj obrazki')
  })
})
