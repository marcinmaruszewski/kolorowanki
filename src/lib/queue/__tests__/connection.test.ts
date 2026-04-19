import { describe, it, expect, afterAll } from 'vitest'
import { redisConnection } from '../connection'

describe('redisConnection', () => {
  afterAll(async () => {
    await redisConnection.quit()
  })

  it('ping zwraca PONG', async () => {
    const result = await redisConnection.ping()
    expect(result).toBe('PONG')
  })
})
