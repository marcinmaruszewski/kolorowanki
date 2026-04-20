import { Worker, type Job } from 'bullmq'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redisConnection } from '../lib/queue/connection'
import { imagesQueue } from '../lib/queue/queues'

type ImagesJobData = {
  calendarId: string
  generationJobId?: string
  batchId?: string
}

export async function processImagesJob(job: Job<ImagesJobData>): Promise<void> {
  const { calendarId } = job.data
  const calendarIdNum = Number(calendarId)
  const payload = await getPayload({ config })
  const { buildImagePrompt } = await import('../lib/openai/image-prompt')
  const { submitBatch, getBatchStatus, downloadBatchResults } = await import('../lib/openai/batch')
  const { IMAGE_MODEL } = await import('../lib/openai/client')

  if (!job.data.batchId) {
    const calendar = await payload.findByID({
      collection: 'calendars',
      id: calendarIdNum,
      overrideAccess: true,
    })

    const days = await payload.find({
      collection: 'days',
      where: {
        and: [
          { calendar: { equals: calendarIdNum } },
          { status: { equals: 'planned' } },
        ],
      },
      overrideAccess: true,
      limit: 31,
    })

    const genJob = await payload.create({
      collection: 'generation-jobs',
      data: {
        calendar: calendarIdNum,
        type: 'images',
        status: 'queued',
      },
      overrideAccess: true,
    })

    const requests = days.docs.map((day) => ({
      custom_id: `day-${calendarId}-${day.day}`,
      body: {
        model: IMAGE_MODEL,
        prompt: buildImagePrompt({
          day: day.day as number,
          month: calendar.month as number,
          occasion: (day.occasion as string | null) ?? null,
          motif: day.motif as string,
          seriesDirection: (calendar.seriesDirection as string | null) ?? null,
        }),
        n: 1,
        size: '1024x1024',
        quality: 'medium',
        background: 'opaque',
        response_format: 'b64_json',
      },
    }))

    const { batchId } = await submitBatch({
      endpoint: '/v1/images/generations',
      requests,
    })

    await payload.update({
      collection: 'generation-jobs',
      id: genJob.id,
      data: {
        status: 'submitted',
        openaiBatchId: batchId,
        startedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    await imagesQueue.add(
      'images',
      { calendarId, generationJobId: String(genJob.id), batchId },
      { delay: 60_000, attempts: 3, backoff: { type: 'exponential', delay: 10_000 } },
    )
    return
  }

  const { generationJobId, batchId } = job.data
  const batchStatus = await getBatchStatus(batchId)

  if (batchStatus.status === 'validating' || batchStatus.status === 'in_progress') {
    await imagesQueue.add(
      'images',
      job.data,
      { delay: 60_000, attempts: 3, backoff: { type: 'exponential', delay: 10_000 } },
    )
    return
  }

  if (
    batchStatus.status === 'failed' ||
    batchStatus.status === 'expired' ||
    batchStatus.status === 'cancelled'
  ) {
    await payload.update({
      collection: 'generation-jobs',
      id: generationJobId!,
      data: {
        status: 'failed',
        errorLog: `Batch ${batchId} zakończony statusem: ${batchStatus.status}`,
        completedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    throw new Error(`Batch ${batchId} zakończony statusem: ${batchStatus.status}`)
  }

  if (batchStatus.status !== 'completed' || !batchStatus.outputFileId) {
    throw new Error(`Nieoczekiwany status batcha: ${batchStatus.status}`)
  }

  const results = await downloadBatchResults(batchStatus.outputFileId)

  const calendar = await payload.findByID({
    collection: 'calendars',
    id: calendarIdNum,
    overrideAccess: true,
  })

  for (const item of results) {
    const match = item.custom_id.match(/^day-\d+-(\d+)$/)
    if (!match) continue
    const dayNum = Number(match[1])

    const dayResult = await payload.find({
      collection: 'days',
      where: {
        and: [
          { calendar: { equals: calendarIdNum } },
          { day: { equals: dayNum } },
        ],
      },
      overrideAccess: true,
      limit: 1,
    })
    if (dayResult.docs.length === 0) continue
    const day = dayResult.docs[0]

    const response = item.response as {
      status_code?: number
      body?: { data?: { b64_json?: string }[] }
    }

    if (response.status_code !== 200 || !response.body?.data?.[0]?.b64_json) {
      await payload.update({
        collection: 'days',
        id: day.id,
        data: { status: 'failed' },
        overrideAccess: true,
      })
      continue
    }

    const fileBuffer = Buffer.from(response.body.data[0].b64_json, 'base64')

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `Dzień ${dayNum}`,
        calendar: calendarIdNum,
      },
      file: {
        data: fileBuffer,
        mimetype: 'image/png',
        name: `calendar-${calendarId}-day-${dayNum}.png`,
        size: fileBuffer.length,
      },
      overrideAccess: true,
    })

    const prompt = buildImagePrompt({
      day: dayNum,
      month: calendar.month as number,
      occasion: (day.occasion as string | null) ?? null,
      motif: day.motif as string,
      seriesDirection: (calendar.seriesDirection as string | null) ?? null,
    })

    await payload.update({
      collection: 'days',
      id: day.id,
      data: {
        status: 'generated',
        image: media.id,
        prompt,
      },
      overrideAccess: true,
    })
  }

  await payload.update({
    collection: 'calendars',
    id: calendarIdNum,
    data: { status: 'generated' },
    overrideAccess: true,
  })

  await payload.update({
    collection: 'generation-jobs',
    id: generationJobId!,
    data: {
      status: 'completed',
      completedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })
}

export const imagesWorker = new Worker<ImagesJobData>('images', processImagesJob, {
  connection: redisConnection,
  concurrency: 2,
})

imagesWorker.on('failed', (job, err) => {
  console.error(`[images-worker] Job ${job?.id} nie powiódł się:`, err.message)
})
