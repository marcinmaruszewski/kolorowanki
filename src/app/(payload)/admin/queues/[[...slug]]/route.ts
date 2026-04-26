import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import express from 'express'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import {
  imagesQueue,
  pdfQueue,
  researchQueue,
  singleImageQueue,
} from '@/lib/queue/queues'

const BASE_PATH = '/admin/queues'

let _expressApp: ReturnType<typeof express> | null = null

function getExpressApp(): ReturnType<typeof express> {
  if (_expressApp) return _expressApp

  const adapter = new ExpressAdapter()
  adapter.setBasePath(BASE_PATH)

  createBullBoard({
    queues: [
      new BullMQAdapter(researchQueue),
      new BullMQAdapter(imagesQueue),
      new BullMQAdapter(singleImageQueue),
      new BullMQAdapter(pdfQueue),
    ],
    serverAdapter: adapter,
  })

  _expressApp = express()
  _expressApp.use(BASE_PATH, adapter.getRouter())
  return _expressApp
}

function proxyToExpress(req: NextRequest): Promise<Response> {
  return new Promise((resolve, reject) => {
    const socket = new Socket()
    const nodeReq = new IncomingMessage(socket)
    nodeReq.method = req.method
    nodeReq.url = req.nextUrl.pathname + (req.nextUrl.search || '')
    req.headers.forEach((value, key) => {
      nodeReq.headers[key] = value
    })

    const chunks: Buffer[] = []
    const nodeRes = new ServerResponse(nodeReq)

    ;(nodeRes as any).write = (chunk: any) => {
      if (chunk != null) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
      }
      return true
    }

    ;(nodeRes as any).end = (chunk?: any) => {
      if (chunk != null) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
      }
      const body = Buffer.concat(chunks)
      const hdrs = new Headers()
      for (const [k, v] of Object.entries(nodeRes.getHeaders())) {
        if (v !== undefined) {
          hdrs.set(k, Array.isArray(v) ? v.join(', ') : String(v))
        }
      }
      resolve(new Response(body, { status: nodeRes.statusCode, headers: hdrs }))
      return nodeRes
    }

    getExpressApp()(nodeReq as any, nodeRes as any, (err?: unknown) => {
      if (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
      } else {
        resolve(new NextResponse('Not Found', { status: 404 }))
      }
    })
  })
}

async function handler(req: NextRequest): Promise<Response> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 })
  }
  return proxyToExpress(req)
}

export const GET = handler
export const POST = handler
