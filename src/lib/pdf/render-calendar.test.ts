import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPayload = vi.hoisted(() => ({
  findByID: vi.fn(),
  find: vi.fn(),
}))

// Minimal valid 1×1 PNG in base64
const mockReadFile = vi.hoisted(() =>
  vi.fn().mockResolvedValue(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    ),
  ),
)

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue(mockPayload),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
}))

import { renderCalendarPdf } from './render-calendar'

const SAMPLE_DAYS = [
  { id: 10, day: 1, image: { id: 1, filename: 'calendar-1-day-1.png', url: '/media/calendar-1-day-1.png' } },
  { id: 11, day: 2, image: { id: 2, filename: 'calendar-1-day-2.png', url: '/media/calendar-1-day-2.png' } },
  { id: 12, day: 3, image: { id: 3, filename: 'calendar-1-day-3.png', url: '/media/calendar-1-day-3.png' } },
]

describe('renderCalendarPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPayload.find.mockResolvedValue({ docs: SAMPLE_DAYS })
  })

  it('zwraca niepusty Buffer gdy layoutJson jest null (fallback buildSlots)', async () => {
    mockPayload.findByID.mockResolvedValue({ id: 1, year: 2026, month: 5, layoutJson: null })

    const buf = await renderCalendarPdf(1)

    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.length).toBeGreaterThan(0)
  })

  it('zwraca niepusty Buffer gdy layoutJson ma obiekty fabric.js', async () => {
    const layoutJson = {
      objects: [
        {
          type: 'image',
          left: 150,
          top: 200,
          angle: 5,
          width: 100,
          height: 120,
          scaleX: 1,
          scaleY: 1,
          src: 'http://localhost:3000/media/calendar-1-day-1.png',
          originX: 'center',
          originY: 'center',
        },
        {
          type: 'image',
          left: 350,
          top: 400,
          angle: -3,
          width: 110,
          height: 130,
          scaleX: 0.9,
          scaleY: 0.9,
          src: 'http://localhost:3000/media/calendar-1-day-2.png',
          originX: 'center',
          originY: 'center',
        },
        {
          type: 'image',
          left: 450,
          top: 600,
          angle: 0,
          width: 105,
          height: 125,
          scaleX: 1,
          scaleY: 1,
          src: 'http://localhost:3000/media/calendar-1-day-3.png',
          originX: 'center',
          originY: 'center',
        },
      ],
    }
    mockPayload.findByID.mockResolvedValue({ id: 1, year: 2026, month: 5, layoutJson })

    const buf = await renderCalendarPdf(1)

    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.length).toBeGreaterThan(0)
  })

  it('pomija day bez media.filename i nadal zwraca PDF', async () => {
    mockPayload.findByID.mockResolvedValue({ id: 1, year: 2026, month: 5, layoutJson: null })
    mockPayload.find.mockResolvedValue({
      docs: [
        { id: 10, day: 1, image: null },
        { id: 11, day: 2, image: { id: 2, filename: 'calendar-1-day-2.png', url: '/media/calendar-1-day-2.png' } },
      ],
    })

    const buf = await renderCalendarPdf(1)

    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.length).toBeGreaterThan(0)
  })
})
