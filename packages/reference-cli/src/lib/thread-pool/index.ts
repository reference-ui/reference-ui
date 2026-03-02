import Piscina from 'piscina'
import { log } from '../log'
import { WORKERS, type WorkerName } from './workers'

let pool: Piscina | undefined
let memoryLogTimer: NodeJS.Timeout | undefined
const memoryLogIntervalMs = 3000

function formatMb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1)
}

function logProcessMemory(reason: string): void {
  const mem = process.memoryUsage()
  log.debug('memory', reason, {
    rssMb: formatMb(mem.rss),
    heapMb: formatMb(mem.heapUsed),
    externalMb: formatMb(mem.external),
  })
}

function initMemoryLogging(): void {
  if (memoryLogTimer) return

  logProcessMemory('startup')
  memoryLogTimer = setInterval(() => {
    logProcessMemory('interval')
  }, memoryLogIntervalMs)
}

function getPool() {
  if (pool) return pool

  initMemoryLogging()
  pool = new Piscina({
    minThreads: 2,
    maxThreads: 6,
    idleTimeout: 30000,
  })

  pool.on('error', (err) => log.error('[pool]', err))
  return pool
}

/** Never-resolving promise. Return from a worker to keep it alive for event-driven work. */
export const KEEP_ALIVE = new Promise<never>(() => {})

/**
 * Run a worker by name (from registry) or by absolute path.
 */
export async function runWorker(
  worker: WorkerName | string,
  payload: unknown
): Promise<unknown> {
  const path =
    typeof worker === 'string' && worker in WORKERS ? WORKERS[worker] : worker
  return getPool().run(payload, { filename: path as string })
}

export { WORKERS, type WorkerName } from './workers'

export async function shutdown() {
  if (pool) {
    await pool.destroy()
    pool = undefined
  }

  if (memoryLogTimer) {
    clearInterval(memoryLogTimer)
    memoryLogTimer = undefined
  }

  logProcessMemory('shutdown')
}
