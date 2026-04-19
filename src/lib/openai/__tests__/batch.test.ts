import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  filesCreate: vi.fn(),
  filesContent: vi.fn(),
  batchesCreate: vi.fn(),
  batchesRetrieve: vi.fn(),
  batchesCancel: vi.fn(),
  toFile: vi.fn().mockResolvedValue(new Blob()),
}))

vi.mock('../client', () => ({
  openai: {
    files: {
      create: mocks.filesCreate,
      content: mocks.filesContent,
    },
    batches: {
      create: mocks.batchesCreate,
      retrieve: mocks.batchesRetrieve,
      cancel: mocks.batchesCancel,
    },
  },
  TEXT_MODEL: 'gpt-5.4',
  IMAGE_MODEL: 'gpt-image-1.5',
}))

vi.mock('openai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openai')>()
  return { ...actual, toFile: mocks.toFile }
})

import { submitBatch, getBatchStatus, downloadBatchResults, cancelBatch } from '../batch'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.toFile.mockResolvedValue(new Blob())
})

describe('submitBatch', () => {
  it('uploaduje plik JSONL i tworzy batch, zwraca batchId', async () => {
    mocks.filesCreate.mockResolvedValue({ id: 'file-abc' })
    mocks.batchesCreate.mockResolvedValue({ id: 'batch-xyz' })

    const result = await submitBatch({
      endpoint: '/v1/responses',
      requests: [{ custom_id: 'research-cal1', body: { model: 'gpt-5.4', input: 'test' } }],
    })

    expect(mocks.filesCreate).toHaveBeenCalledOnce()
    expect(mocks.filesCreate.mock.calls[0][0]).toMatchObject({ purpose: 'batch' })
    expect(mocks.batchesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        input_file_id: 'file-abc',
        endpoint: '/v1/responses',
        completion_window: '24h',
      }),
    )
    expect(result).toEqual({ batchId: 'batch-xyz' })
  })

  it('działa dla endpointu images', async () => {
    mocks.filesCreate.mockResolvedValue({ id: 'file-img' })
    mocks.batchesCreate.mockResolvedValue({ id: 'batch-img' })

    const result = await submitBatch({
      endpoint: '/v1/images/generations',
      requests: [{ custom_id: 'day-cal1-1', body: { model: 'gpt-image-1.5', prompt: 'test' } }],
    })

    expect(result).toEqual({ batchId: 'batch-img' })
    expect(mocks.batchesCreate).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: '/v1/images/generations' }),
    )
  })
})

describe('getBatchStatus', () => {
  it('zwraca status completed z outputFileId', async () => {
    mocks.batchesRetrieve.mockResolvedValue({
      status: 'completed',
      output_file_id: 'out-file-1',
      error_file_id: null,
    })

    const result = await getBatchStatus('batch-xyz')

    expect(result).toEqual({
      status: 'completed',
      outputFileId: 'out-file-1',
      errorFileId: null,
    })
  })

  it('zwraca status in_progress bez outputFileId', async () => {
    mocks.batchesRetrieve.mockResolvedValue({
      status: 'in_progress',
      output_file_id: undefined,
      error_file_id: undefined,
    })

    const result = await getBatchStatus('batch-xyz')

    expect(result).toEqual({
      status: 'in_progress',
      outputFileId: null,
      errorFileId: null,
    })
  })

  it('zwraca status failed z errorFileId', async () => {
    mocks.batchesRetrieve.mockResolvedValue({
      status: 'failed',
      output_file_id: null,
      error_file_id: 'err-file-1',
    })

    const result = await getBatchStatus('batch-xyz')

    expect(result).toEqual({
      status: 'failed',
      outputFileId: null,
      errorFileId: 'err-file-1',
    })
  })
})

describe('downloadBatchResults', () => {
  it('parsuje JSONL i zwraca tablicę wyników', async () => {
    const lines = [
      JSON.stringify({ custom_id: 'research-cal1', response: { status: 200, body: { result: 'ok' } } }),
      JSON.stringify({ custom_id: 'day-cal1-2', response: { status: 200, body: { url: 'https://img' } } }),
    ].join('\n')

    mocks.filesContent.mockResolvedValue({ text: async () => lines })

    const results = await downloadBatchResults('out-file-1')

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({
      custom_id: 'research-cal1',
      response: { status: 200, body: { result: 'ok' } },
    })
    expect(results[1].custom_id).toBe('day-cal1-2')
  })

  it('ignoruje puste linie', async () => {
    const lines = JSON.stringify({ custom_id: 'x', response: {} }) + '\n\n'
    mocks.filesContent.mockResolvedValue({ text: async () => lines })

    const results = await downloadBatchResults('out-file-1')
    expect(results).toHaveLength(1)
  })
})

describe('cancelBatch', () => {
  it('woła openai.batches.cancel z batchId', async () => {
    mocks.batchesCancel.mockResolvedValue({})

    await cancelBatch('batch-xyz')

    expect(mocks.batchesCancel).toHaveBeenCalledWith('batch-xyz')
  })
})
