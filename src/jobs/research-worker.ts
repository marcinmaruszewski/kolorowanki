import { Worker, type Job } from 'bullmq'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redisConnection } from '../lib/queue/connection'
import { researchQueue } from '../lib/queue/queues'

type ResearchJobData = {
  calendarId: string
  generationJobId?: string
  batchId?: string
}

// Mapowanie weekday z research schema na wartości Days collection
const WEEKDAY_MAP: Record<string, string> = {
  sr: 'śr',
  nd: 'niedz',
}

function mapWeekday(w: string): string {
  return WEEKDAY_MAP[w] ?? w
}

export async function processResearchJob(job: Job<ResearchJobData>): Promise<void> {
  const { calendarId } = job.data
  const calendarIdNum = Number(calendarId)
  const payload = await getPayload({ config })
  // Lazy import — unikamy inicjalizacji klienta OpenAI przy starcie workera (brak OPENAI_API_KEY w dev)
  const { buildResearchPrompt, parseMonthPlan } = await import('../lib/openai/research')
  const { submitBatch, getBatchStatus, downloadBatchResults } = await import('../lib/openai/batch')
  const { TEXT_MODEL } = await import('../lib/openai/client')

  // Faza submitowania — brak batchId oznacza pierwsza iteracja
  if (!job.data.batchId) {
    const genJob = await payload.create({
      collection: 'generation-jobs',
      data: {
        calendar: calendarIdNum,
        type: 'research',
        status: 'queued',
      },
      overrideAccess: true,
    })

    const calendar = await payload.findByID({
      collection: 'calendars',
      id: calendarIdNum,
      overrideAccess: true,
    })

    const prompt = buildResearchPrompt(calendar.year as number, calendar.month as number)

    const { batchId } = await submitBatch({
      endpoint: '/v1/responses',
      requests: [
        {
          custom_id: `research-${calendarId}`,
          body: {
            model: TEXT_MODEL,
            input: prompt,
            tools: [{ type: 'web_search_preview' }],
            text: { format: { type: 'json_object' } },
          },
        },
      ],
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

    await researchQueue.add(
      'research',
      { calendarId, generationJobId: String(genJob.id), batchId },
      { delay: 30_000, attempts: 3, backoff: { type: 'exponential', delay: 5_000 } },
    )
    return
  }

  // Faza pollingu
  const { generationJobId, batchId } = job.data
  const batchStatus = await getBatchStatus(batchId)

  if (batchStatus.status === 'validating' || batchStatus.status === 'in_progress') {
    await researchQueue.add(
      'research',
      job.data,
      { delay: 30_000, attempts: 3, backoff: { type: 'exponential', delay: 5_000 } },
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

  // Status completed — pobierz wyniki i zapisz days
  if (batchStatus.status !== 'completed' || !batchStatus.outputFileId) {
    throw new Error(`Nieoczekiwany status batcha: ${batchStatus.status}`)
  }

  const results = await downloadBatchResults(batchStatus.outputFileId)
  const item = results.find((r) => r.custom_id === `research-${calendarId}`)
  if (!item) throw new Error(`Brak wyniku dla research-${calendarId} w batch ${batchId}`)

  const responseBody = (item.response as { body?: { output?: { content?: { text?: string }[] }[]; usage?: { input_tokens?: number; output_tokens?: number } } })?.body
  const outputText = responseBody?.output?.[0]?.content?.[0]?.text
  if (!outputText) throw new Error(`Brak tekstu w wyniku batcha dla research-${calendarId}`)

  const plan = parseMonthPlan(JSON.parse(outputText))
  const usage = responseBody?.usage

  for (const dayData of plan.days) {
    const existing = await payload.find({
      collection: 'days',
      where: {
        and: [
          { calendar: { equals: calendarIdNum } },
          { day: { equals: dayData.day } },
        ],
      },
      overrideAccess: true,
      limit: 1,
    })

    const data = {
      calendar: calendarIdNum,
      day: dayData.day,
      weekday: mapWeekday(dayData.weekday) as 'pon' | 'wt' | 'śr' | 'czw' | 'pt' | 'sob' | 'niedz',
      occasion: dayData.occasion ?? undefined,
      motif: dayData.motif,
      sources: dayData.sources.map((url) => ({ url })),
      status: 'planned' as const,
    }

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'days',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'days',
        data,
        overrideAccess: true,
      })
    }
  }

  await payload.update({
    collection: 'calendars',
    id: calendarIdNum,
    data: { status: 'planned', planMd: outputText },
    overrideAccess: true,
  })

  await payload.update({
    collection: 'generation-jobs',
    id: generationJobId!,
    data: {
      status: 'completed',
      completedAt: new Date().toISOString(),
      inputTokens: usage?.input_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0,
    },
    overrideAccess: true,
  })
}

export const researchWorker = new Worker<ResearchJobData>('research', processResearchJob, {
  connection: redisConnection,
  concurrency: 5,
})

researchWorker.on('failed', (job, err) => {
  console.error(`[research-worker] Job ${job?.id} nie powiódł się:`, err.message)
})
