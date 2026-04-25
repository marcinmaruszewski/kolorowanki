import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUser } from '@/lib/auth/current-user'
import { renderCalendarPdf } from '@/lib/pdf/render-calendar'
import type { Calendar, Media } from '@/payload-types'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })

  const { id } = await params
  const payload = await getPayload({ config: configPromise })

  let calendar: Calendar
  try {
    calendar = (await payload.findByID({
      collection: 'calendars',
      id: Number(id),
      depth: 1,
      overrideAccess: true,
    })) as Calendar
  } catch {
    return NextResponse.json({ error: 'Nie znaleziono kalendarza' }, { status: 404 })
  }

  const ownerId = typeof calendar.owner === 'object' ? calendar.owner.id : calendar.owner
  if (ownerId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 })
  }

  const month = String(calendar.month).padStart(2, '0')
  const filename = `kalendarz-${calendar.year}-${month}.pdf`

  // Próbuj odczytać zapisany plik z media
  const pdfMedia = calendar.pdfFile as Media | number | null | undefined
  if (pdfMedia && typeof pdfMedia === 'object' && pdfMedia.filename) {
    try {
      const mediaDir = path.join(process.cwd(), 'media')
      const fileBytes = await readFile(path.join(mediaDir, pdfMedia.filename))
      return new Response(new Uint8Array(fileBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch {
      // fallback: renderuj on-demand
    }
  }

  // Fallback: renderuj PDF on-demand
  const buffer = await renderCalendarPdf(Number(id))
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
