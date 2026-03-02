import { createWorkerPool } from './create-pool'
import manifest from '../../../workers.json'

export const syncWorkers = createWorkerPool(manifest)

/** Build entries for tsup (from workers.json) */
export const workerEntries = Object.fromEntries(
  Object.entries(manifest as Record<string, string>).map(([name, src]) => [
    `${name}/worker`,
    src,
  ])
)
