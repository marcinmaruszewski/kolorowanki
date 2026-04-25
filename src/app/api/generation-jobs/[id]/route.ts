import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUser } from '@/lib/auth/current-user'
import type { GenerationJob, Calendar } from '@/payload-types'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })

  const { id } = await params
  const payload = await getPayload({ config: configPromise })

  let job: GenerationJob
  try {
    job = (await payload.findByID({
      collection: 'generation-jobs',
      id: Number(id),
      depth: 1,
      overrideAccess: true,
    })) as GenerationJob
  } catch {
    return NextResponse.json({ error: 'Nie znaleziono zadania' }, { status: 404 })
  }

  const calendar = job.calendar as Calendar
  const ownerId = typeof calendar.owner === 'object' ? calendar.owner.id : calendar.owner
  if (ownerId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 })
  }

  return NextResponse.json({ status: job.status, errorLog: job.errorLog ?? null })
}
