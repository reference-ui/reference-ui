import { resolveWorkerUrl } from './utils'
import workerManifest from './manifest.json'

/**
 * Worker registry - maps worker names to their file paths
 */
export const WORKERS = Object.fromEntries(
  Object.keys(workerManifest).map(
    name => [name, resolveWorkerUrl(`${name}/worker.mjs`)] as const
  )
) as Record<keyof typeof workerManifest, string>

export type WorkerName = keyof typeof WORKERS
