import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import { devLogin, fetchText, waitForApp } from '../helpers/app'

describe('task-031: galeria obrazków', () => {
  beforeAll(async () => {
    await waitForApp()
  })

  it('dla kalendarza z generated dniami pokazuje 31 kafelków', async () => {
    const email = `test-gallery-${Date.now()}@example.com`
    const { cookie, body } = await devLogin(email)
    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()

    const calendar = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: body.userId,
        year: 2026,
        month: 1, // styczeń ma 31 dni, zaczyna się w czwartek (leadingCells = 3)
        status: 'generated',
        updatedAt: now,
        createdAt: now,
      },
    })

    for (let day = 1; day <= 31; day += 1) {
      await payload.db.create({
        collection: 'days',
        data: {
          calendar: calendar.id,
          day,
          occasion: `Okazja ${day}`,
          motif: `Motyw ${day}`,
          status: 'generated',
          updatedAt: now,
          createdAt: now,
        },
      })
    }

    const { res, text } = await fetchText(`/kalendarz/${calendar.id}/obrazki`, {
      headers: { cookie },
    })

    expect(res.status).toBe(200)

    // Sprawdź czy strona zawiera nagłówki dni tygodnia
    expect(text).toContain('Pon')
    expect(text).toContain('Niedz')

    // Policz kafelki z numerami dni (tylko HTML, nie RSC payload)
    const matches = text.match(/class="day-tile-number"/g)
    expect(matches).not.toBeNull()
    expect(matches!.length).toBe(31)
  })

  it('dla kalendarza z pending dniami pokazuje meta refresh i komunikat', async () => {
    const email = `test-gallery-pending-${Date.now()}@example.com`
    const { cookie, body } = await devLogin(email)
    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()

    const calendar = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: body.userId,
        year: 2026,
        month: 3,
        status: 'plan_accepted',
        updatedAt: now,
        createdAt: now,
      },
    })

    await payload.db.create({
      collection: 'days',
      data: {
        calendar: calendar.id,
        day: 1,
        occasion: 'Test',
        motif: 'Test motyw',
        status: 'generating',
        updatedAt: now,
        createdAt: now,
      },
    })

    const { res, text } = await fetchText(`/kalendarz/${calendar.id}/obrazki`, {
      headers: { cookie },
    })

    expect(res.status).toBe(200)
    expect(text).toContain('Generowanie w toku')
    expect(text).toMatch(/refresh.*10|content="10"/)
  })

  it('przycisk Do edytora jest disabled gdy nie wszystkie dni generated', async () => {
    const email = `test-gallery-disabled-${Date.now()}@example.com`
    const { cookie, body } = await devLogin(email)
    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()

    const calendar = await payload.db.create({
      collection: 'calendars',
      data: {
        owner: body.userId,
        year: 2026,
        month: 4,
        status: 'plan_accepted',
        updatedAt: now,
        createdAt: now,
      },
    })

    await payload.db.create({
      collection: 'days',
      data: {
        calendar: calendar.id,
        day: 1,
        status: 'generating',
        updatedAt: now,
        createdAt: now,
      },
    })

    const { res, text } = await fetchText(`/kalendarz/${calendar.id}/obrazki`, {
      headers: { cookie },
    })

    expect(res.status).toBe(200)
    expect(text).toContain('btn-disabled')
  })
})
