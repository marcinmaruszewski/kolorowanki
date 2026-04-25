import { researchWorker } from './research-worker'
import { imagesWorker } from './images-worker'
import { singleImageWorker } from './single-image-worker'
import { pdfWorker } from './pdf-worker'

console.log('Worker entrypoint started, awaiting jobs…')

const workers: { close: () => Promise<void> }[] = [researchWorker, imagesWorker, singleImageWorker, pdfWorker]

async function gracefulShutdown() {
  console.log('SIGTERM received, shutting down workers…')
  await Promise.all(workers.map((w) => w.close()))
  console.log('Workers closed, exiting.')
  process.exit(0)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
