import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Worker registry - maps worker names to their file paths
 */
export const WORKERS = {
  virtual: join(__dirname, 'virtual', 'worker.mjs'),
} as const

export type WorkerName = keyof typeof WORKERS
