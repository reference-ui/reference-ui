import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveCorePackageDir } from '../utils/resolve-core'

const selfPath = fileURLToPath(import.meta.url)
const coreDir = resolveCorePackageDir(dirname(selfPath))
const virtualWorkerPath = resolve(coreDir, 'dist/cli/virtual/worker.mjs')

/**
 * Worker registry - maps worker names to their file paths
 */
export const WORKERS = {
  virtual: virtualWorkerPath,
} as const

export type WorkerName = keyof typeof WORKERS
