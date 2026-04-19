// Worker entrypoint — imports and starts all BullMQ workers.
// Actual worker implementations are added in tasks 021-023.

console.log('Worker entrypoint started, awaiting jobs…')

const workers: { close: () => Promise<void> }[] = []

async function gracefulShutdown() {
  console.log('SIGTERM received, shutting down workers…')
  await Promise.all(workers.map((w) => w.close()))
  console.log('Workers closed, exiting.')
  process.exit(0)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
