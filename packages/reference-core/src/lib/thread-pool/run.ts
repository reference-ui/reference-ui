import Piscina from 'piscina'
import type { ReferenceUIConfig } from '../../config/types'
import { log } from '../log'
import { config } from './config'

let pool: Piscina | undefined
let memoryLogTimer: NodeJS.Timeout | undefined
const memoryLogIntervalMs = 3000

function formatMb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1)
}

function logProcessMemory(reason: string): void {
  if (!config.resourceUsageLogs) return

  const mem = process.memoryUsage()
  log.debug('memory', reason, {
    rssMb: formatMb(mem.rss),
    heapMb: formatMb(mem.heapUsed),
    externalMb: formatMb(mem.external),
  })
}

function initMemoryLogging(): void {
  if (!config.resourceUsageLogs || memoryLogTimer) return

  logProcessMemory('startup')
  memoryLogTimer = setInterval(() => {
    logProcessMemory('interval')
  }, memoryLogIntervalMs)
}

export interface PoolWorkerData {
  config: ReferenceUIConfig
  cwd: string
}

/**
 * Initialize the pool with config and cwd. Must be called before first runWorker.
 * Passed via workerData so workers can access them without per-task wiring.
 */
export function initPool(data: PoolWorkerData): void {
  if (pool) return

  initMemoryLogging()
  pool = new Piscina({
    minThreads: 2,
    maxThreads: 6,
    idleTimeout: 30000,
    workerData: data,
  })

  pool.on('error', (err) => log.error('[pool]', err))
}

function getPool(): Piscina {
  if (!pool) {
    throw new Error('initPool(config) must be called before runWorker')
  }
  return pool
}

/** Never-resolving promise. Return from a worker to keep it alive for event-driven work. */
export const KEEP_ALIVE = new Promise<never>(() => {})

/**
 * Run a worker by its absolute path.
 */
export async function runWorker(workerPath: string, payload: unknown): Promise<unknown> {
  return getPool().run(payload, { filename: workerPath })
}

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
