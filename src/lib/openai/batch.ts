import { openai } from './client'
import { toFile } from 'openai'

export type BatchEndpoint = '/v1/responses' | '/v1/images/generations'

export interface BatchRequest {
  custom_id: string
  body: Record<string, unknown>
}

export interface BatchStatus {
  status: 'validating' | 'in_progress' | 'completed' | 'failed' | 'expired' | 'cancelled'
  outputFileId: string | null
  errorFileId: string | null
}

export interface BatchResultItem {
  custom_id: string
  response: unknown
}

export async function submitBatch(input: {
  endpoint: BatchEndpoint
  requests: BatchRequest[]
}): Promise<{ batchId: string }> {
  const lines = input.requests.map((req) =>
    JSON.stringify({
      custom_id: req.custom_id,
      method: 'POST',
      url: input.endpoint,
      body: req.body,
    }),
  )
  const jsonl = lines.join('\n')
  const blob = new Blob([jsonl], { type: 'application/octet-stream' })
  const file = await toFile(blob, 'batch.jsonl', { type: 'application/octet-stream' })

  const uploaded = await openai.files.create({ file, purpose: 'batch' })

  const batch = await openai.batches.create({
    input_file_id: uploaded.id,
    endpoint: input.endpoint,
    completion_window: '24h',
  })

  return { batchId: batch.id }
}

export async function getBatchStatus(batchId: string): Promise<BatchStatus> {
  const batch = await openai.batches.retrieve(batchId)
  return {
    status: batch.status as BatchStatus['status'],
    outputFileId: batch.output_file_id ?? null,
    errorFileId: batch.error_file_id ?? null,
  }
}

export async function downloadBatchResults(outputFileId: string): Promise<BatchResultItem[]> {
  const response = await openai.files.content(outputFileId)
  const text = await response.text()
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parsed = JSON.parse(line) as { custom_id: string; response: unknown }
      return { custom_id: parsed.custom_id, response: parsed.response }
    })
}

export async function cancelBatch(batchId: string): Promise<void> {
  await openai.batches.cancel(batchId)
}
