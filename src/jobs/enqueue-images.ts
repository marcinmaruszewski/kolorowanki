import { getPayload } from 'payload'
import config from '@payload-config'
import { buildImagePrompt } from '../lib/openai/image-prompt'
import { submitBatch } from '../lib/openai/batch'
import { IMAGE_MODEL } from '../lib/openai/client'
import { imagesQueue } from '../lib/queue/queues'

export async function enqueueImagesBatch(calendarId: number): Promise<void> {
  const payload = await getPayload({ config })

  const calendar = await payload.findByID({
    collection: 'calendars',
    id: calendarId,
    overrideAccess: true,
  })

  const { docs: days } = await payload.find({
    collection: 'days',
    where: { calendar: { equals: calendarId } },
    sort: 'day',
    limit: 31,
    overrideAccess: true,
  })

  const requests = days.map((day) => ({
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

  const genJob = await payload.create({
    collection: 'generation-jobs',
    data: {
      calendar: calendarId,
      type: 'images',
      status: 'submitted',
      openaiBatchId: batchId,
      startedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  await imagesQueue.add(
    'images',
    { calendarId: String(calendarId), generationJobId: String(genJob.id), batchId },
    { delay: 60_000, attempts: 3, backoff: { type: 'exponential', delay: 10_000 } },
  )
}
