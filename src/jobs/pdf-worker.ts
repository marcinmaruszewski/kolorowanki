import { Worker, type Job } from 'bullmq'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redisConnection } from '../lib/queue/connection'

type PdfJobData = {
  calendarId: string
  generationJobId?: string
}

export async function processPdfJob(job: Job<PdfJobData>): Promise<void> {
  const { calendarId } = job.data
  const calendarIdNum = Number(calendarId)
  const payload = await getPayload({ config })
  const { renderCalendarPdf } = await import('../lib/pdf/render-calendar')

  let generationJobId = job.data.generationJobId
  if (!generationJobId) {
    const genJob = await payload.create({
      collection: 'generation-jobs',
      data: {
        calendar: calendarIdNum,
        type: 'pdf',
        status: 'queued',
      },
      overrideAccess: true,
    })
    generationJobId = String(genJob.id)
  }

  try {
    await payload.update({
      collection: 'generation-jobs',
      id: generationJobId,
      data: { status: 'in-progress', startedAt: new Date().toISOString() },
      overrideAccess: true,
    })

    const calendar = await payload.findByID({
      collection: 'calendars',
      id: calendarIdNum,
      overrideAccess: true,
    })
    const month = String(calendar.month).padStart(2, '0')
    const filename = `kalendarz-${calendar.year}-${month}.pdf`

    const buffer = await renderCalendarPdf(calendarIdNum)

    const media = await payload.create({
      collection: 'media',
      data: {},
      file: {
        data: buffer,
        name: filename,
        mimetype: 'application/pdf',
        size: buffer.length,
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'calendars',
      id: calendarIdNum,
      data: { pdfFile: media.id, status: 'exported' },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'generation-jobs',
      id: generationJobId,
      data: { status: 'completed', completedAt: new Date().toISOString() },
      overrideAccess: true,
    })
  } catch (err) {
    await payload.update({
      collection: 'generation-jobs',
      id: generationJobId,
      data: { status: 'failed', errorLog: String(err), completedAt: new Date().toISOString() },
      overrideAccess: true,
    })
    throw err
  }
}

export const pdfWorker = new Worker<PdfJobData>('pdf', processPdfJob, {
  connection: redisConnection,
  concurrency: 2,
})

pdfWorker.on('failed', (job, err) => {
  console.error(`[pdf-worker] Job ${job?.id} nie powiódł się:`, err.message)
})
