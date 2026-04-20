import { Worker, type Job } from 'bullmq'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redisConnection } from '../lib/queue/connection'

const SINGLE_IMAGE_LIMIT = 20

type SingleImageJobData = {
  dayId: string
  newPrompt?: string
}

export async function processSingleImageJob(job: Job<SingleImageJobData>): Promise<void> {
  const { dayId, newPrompt } = job.data
  const payload = await getPayload({ config })
  const { openai, IMAGE_MODEL } = await import('../lib/openai/client')
  const { buildImagePrompt } = await import('../lib/openai/image-prompt')

  const day = await payload.findByID({
    collection: 'days',
    id: Number(dayId),
    overrideAccess: true,
  })

  const calendarId =
    typeof day.calendar === 'number' ? day.calendar : (day.calendar as { id: number }).id

  const existingJobs = await payload.find({
    collection: 'generation-jobs',
    where: {
      and: [
        { calendar: { equals: calendarId } },
        { type: { equals: 'single-image' } },
      ],
    },
    overrideAccess: true,
    limit: 1,
  })

  if (existingJobs.totalDocs >= SINGLE_IMAGE_LIMIT) {
    const errorMsg = `Limit regeneracji (${SINGLE_IMAGE_LIMIT}) dla kalendarza ${calendarId} wyczerpany`
    await payload.create({
      collection: 'generation-jobs',
      data: {
        calendar: calendarId,
        type: 'single-image',
        status: 'failed',
        errorLog: errorMsg,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    throw new Error(errorMsg)
  }

  const calendar = await payload.findByID({
    collection: 'calendars',
    id: calendarId,
    overrideAccess: true,
  })

  const genJob = await payload.create({
    collection: 'generation-jobs',
    data: {
      calendar: calendarId,
      type: 'single-image',
      status: 'in-progress',
      startedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  const prompt =
    newPrompt ??
    buildImagePrompt({
      day: day.day as number,
      month: calendar.month as number,
      occasion: (day.occasion as string | null) ?? null,
      motif: day.motif as string,
      seriesDirection: (calendar.seriesDirection as string | null) ?? null,
    })

  let b64: string | undefined
  try {
    const result = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'medium',
      response_format: 'b64_json',
    })
    b64 = result.data?.[0]?.b64_json
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    await payload.update({
      collection: 'generation-jobs',
      id: genJob.id,
      data: {
        status: 'failed',
        errorLog: errorMsg,
        completedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    throw err
  }

  if (!b64) {
    const errorMsg = 'Brak b64_json w odpowiedzi OpenAI'
    await payload.update({
      collection: 'generation-jobs',
      id: genJob.id,
      data: {
        status: 'failed',
        errorLog: errorMsg,
        completedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    throw new Error(errorMsg)
  }

  const oldImageId = day.image
  if (oldImageId) {
    const oldId =
      typeof oldImageId === 'number' ? oldImageId : (oldImageId as { id: number }).id
    await payload.delete({
      collection: 'media',
      id: oldId,
      overrideAccess: true,
    })
  }

  const fileBuffer = Buffer.from(b64, 'base64')
  const media = await payload.create({
    collection: 'media',
    data: {
      alt: `Dzień ${day.day}`,
      calendar: calendarId,
    },
    file: {
      data: fileBuffer,
      mimetype: 'image/png',
      name: `calendar-${calendarId}-day-${day.day}-regen.png`,
      size: fileBuffer.length,
    },
    overrideAccess: true,
  })

  await payload.update({
    collection: 'days',
    id: Number(dayId),
    data: {
      status: 'generated',
      image: media.id,
      prompt,
    },
    overrideAccess: true,
  })

  await payload.update({
    collection: 'generation-jobs',
    id: genJob.id,
    data: {
      status: 'completed',
      completedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })
}

export const singleImageWorker = new Worker<SingleImageJobData>(
  'single-image',
  processSingleImageJob,
  {
    connection: redisConnection,
    concurrency: 3,
  },
)

singleImageWorker.on('failed', (job, err) => {
  console.error(`[single-image-worker] Job ${job?.id} nie powiódł się:`, err.message)
})
