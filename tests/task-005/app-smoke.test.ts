import { beforeAll, describe, expect, it } from 'vitest'
import { BASE, waitForApp } from '../helpers/app'

describe('task-005: app smoke', () => {
  beforeAll(async () => {
    await waitForApp()
  })

  it('root endpoint odpowiada', async () => {
    const res = await fetch(`${BASE}/`, { redirect: 'manual' })
    expect(res.status).toBeGreaterThan(0)
  })

  it('/admin zwraca 2xx albo 3xx', async () => {
    const res = await fetch(`${BASE}/admin`, { redirect: 'manual' })
    expect(res.status).toBeGreaterThanOrEqual(200)
    expect(res.status).toBeLessThan(400)
  })
})
