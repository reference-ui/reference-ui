import { runWorker as runPoolWorker } from './run'
import { log } from '../log'
import { resolveCliDistPath } from '../paths'

/**
 * Registry of worker names to their absolute paths.
 */
export type ThreadPoolRegistry = Record<string, string>

/**
 * Manifest declares which workers exist. Use keys only; values are ignored.
 */
export type ThreadPoolManifest = Record<string, unknown>

/**
 * Create a worker pool from a manifest.
 * Keys are logical names (e.g. 'watch'); path convention \`${name}/worker.mjs\` mirrors tsup output
 */
export function createWorkerPool<T extends ThreadPoolManifest>(manifest: T) {
  const WORKERS = Object.fromEntries(
    Object.keys(manifest).map((name) => [
      name,
      resolveCliDistPath(`${name}/worker.mjs`),
    ])
  ) as Record<keyof T & string, string>

  return {
    WORKERS,
    runWorker: (worker: keyof T | string, payload: unknown) => {
      const path = typeof worker === 'string' && worker in WORKERS ? WORKERS[worker] : worker
      const name = typeof worker === 'string' ? worker : 'worker'
      return runPoolWorker(path as string, payload).catch((err: unknown) => {
        log.error(`[${name}] Worker failed:`, err)
      })
    },
  }
}
