import Piscina from 'piscina'
import type { ReferenceUIConfig } from '../../config/types'
import { log } from '../log'
import { config } from './config'

let pool: Piscina | undefined
const dedicatedPools = new Map<string, Piscina>()
let poolWorkerData: PoolWorkerData | undefined
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

export interface PoolOptions {
  minThreads?: number
  maxThreads?: number
}

export interface RunWorkerOptions {
  poolName?: string
}

/**
 * Initialize the pool with config and cwd. Must be called before first runWorker.
 * Passed via workerData so workers can access them without per-task wiring.
 */
export function initPool(data: PoolWorkerData, options: PoolOptions = {}): void {
  if (pool) return

  poolWorkerData = data
  initMemoryLogging()
  const minThreads = options.minThreads ?? 2
  const maxThreads = options.maxThreads ?? 6
  pool = new Piscina({
    minThreads,
    maxThreads,
    idleTimeout: 30000,
    workerData: data,
  })

  pool.on('error', err => log.error('[pool]', err))
}

function getPool(): Piscina {
  if (!pool) {
    throw new Error('initPool(config) must be called before runWorker')
  }
  return pool
}

function getDedicatedPool(poolName: string): Piscina {
  const existing = dedicatedPools.get(poolName)
  if (existing) {
    return existing
  }

  if (!poolWorkerData) {
    throw new Error('initPool(config) must be called before runWorker')
  }

  const dedicatedPool = new Piscina({
    minThreads: 1,
    maxThreads: 1,
    idleTimeout: 30000,
    workerData: poolWorkerData,
  })

  dedicatedPool.on('error', err => log.error(`[pool:${poolName}]`, err))
  dedicatedPools.set(poolName, dedicatedPool)
  return dedicatedPool
}

/** Never-resolving promise. Return from a worker to keep it alive for event-driven work. */
export const KEEP_ALIVE = new Promise<never>(() => {})

/**
 * Run a worker by its absolute path.
 */
export async function runWorker(
  workerPath: string,
  payload: unknown,
  options?: RunWorkerOptions
): Promise<unknown> {
  const activePool = options?.poolName ? getDedicatedPool(options.poolName) : getPool()
  return activePool.run(payload, { filename: workerPath })
}

export async function shutdown() {
  for (const dedicatedPool of dedicatedPools.values()) {
    await dedicatedPool.destroy()
  }
  dedicatedPools.clear()

  if (pool) {
    await pool.destroy()
    pool = undefined
  }
  poolWorkerData = undefined

  if (memoryLogTimer) {
    clearInterval(memoryLogTimer)
    memoryLogTimer = undefined
  }

  logProcessMemory('shutdown')
}
