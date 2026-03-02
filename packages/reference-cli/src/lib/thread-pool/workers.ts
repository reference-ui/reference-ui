import { resolveCliDistPath } from '../paths'
import workerManifest from './workers.json'

/**
 * Worker registry – maps worker names to their paths.
 * Add workers to workers.json as we add modules.
 */
export const WORKERS = Object.fromEntries(
  Object.keys(workerManifest).map((name) => [
    name,
    resolveCliDistPath(`${name}/worker.mjs`),
  ])
) as Record<string, string>

export type WorkerName = keyof typeof workerManifest
