import path from 'path'
import { readFile } from 'fs/promises'
import { PDFDocument, degrees } from 'pdf-lib'
import { getPayload } from 'payload'
import config from '@payload-config'
import { buildSlots } from '../layout/build-slots'
import type { Day, Media } from '../../payload-types'

const PAGE_W = 595
const PAGE_H = 842

interface FabricImageObject {
  type: string
  left: number
  top: number
  angle: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  src?: string
  originX?: string
  originY?: string
}

interface FabricJson {
  objects: FabricImageObject[]
}

export async function renderCalendarPdf(calendarId: number): Promise<Buffer> {
  const payload = await getPayload({ config })

  const calendar = await payload.findByID({
    collection: 'calendars',
    id: calendarId,
    overrideAccess: true,
  })

  const daysResult = await payload.find({
    collection: 'days',
    where: { calendar: { equals: calendarId } },
    depth: 2,
    limit: 31,
    overrideAccess: true,
  })

  const days = daysResult.docs as Day[]
  const doc = await PDFDocument.create()
  const page = doc.addPage([PAGE_W, PAGE_H])
  const mediaDir = path.join(process.cwd(), 'media')

  const layoutJson = calendar.layoutJson as FabricJson | null | undefined

  if (layoutJson && Array.isArray(layoutJson.objects) && layoutJson.objects.length > 0) {
    for (const obj of layoutJson.objects) {
      if (obj.type !== 'image' || !obj.src) continue

      // Match by filename extracted from src URL
      const srcFilename = obj.src.split('/').pop()
      const day = days.find((d) => {
        const media = d.image as Media | null | undefined
        return media?.filename === srcFilename
      })

      if (!day) continue
      const media = day.image as Media | null | undefined
      if (!media?.filename) continue

      let imgBytes: Buffer
      try {
        imgBytes = await readFile(path.join(mediaDir, media.filename))
      } catch {
        continue
      }

      const pdfImage = await doc.embedPng(imgBytes)
      const actualW = obj.width * (obj.scaleX ?? 1)
      const actualH = obj.height * (obj.scaleY ?? 1)

      // fabric.js with center origin: left/top are center coords
      const topLeftX = obj.left - actualW / 2
      const topLeftY = obj.top - actualH / 2

      // Convert from fabric (y=down from top) to pdf (y=up from bottom)
      const pdfY = PAGE_H - topLeftY - actualH

      page.drawImage(pdfImage, {
        x: topLeftX,
        y: pdfY,
        width: actualW,
        height: actualH,
        rotate: degrees(obj.angle ?? 0),
      })
    }
  } else {
    const slots = buildSlots(days.length || 28, PAGE_W, PAGE_H)

    for (const day of days) {
      const media = day.image as Media | null | undefined
      if (!media?.filename) continue

      const slot = slots.find((s) => s.dayNumber === day.day)
      if (!slot) continue

      let imgBytes: Buffer
      try {
        imgBytes = await readFile(path.join(mediaDir, media.filename))
      } catch {
        continue
      }

      const pdfImage = await doc.embedPng(imgBytes)

      // slot coords: top-left, y growing down → convert to pdf
      const pdfY = PAGE_H - slot.y - slot.h

      page.drawImage(pdfImage, {
        x: slot.x,
        y: pdfY,
        width: slot.w,
        height: slot.h,
        rotate: degrees(slot.rotationDeg),
      })
    }
  }

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}
