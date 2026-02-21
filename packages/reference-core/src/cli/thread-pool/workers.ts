import { resolveWorkerUrl } from './utils'

const virtualWorkerPath = resolveWorkerUrl('virtual/worker.mjs')

/**
 * Worker registry - maps worker names to their file paths
 */
export const WORKERS = {
  virtual: virtualWorkerPath,
} as const

export type WorkerName = keyof typeof WORKERS
