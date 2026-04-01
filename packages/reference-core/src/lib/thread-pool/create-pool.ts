import { runWorker as runPoolWorker, type RunWorkerOptions } from './run'
import { log } from '../log'
import { resolveCoreDistPath } from '../paths'

/**
 * Registry of worker names to their absolute paths.
 */
export type ThreadPoolRegistry = Record<string, string>

/**
 * Manifest declares which workers exist. Use keys only; values are ignored.
 */
export type ThreadPoolManifest = Record<string, unknown>

function isExpectedShutdownError(err: unknown): boolean {
  return err instanceof Error && err.message === 'Terminating worker thread'
}

/**
 * Create a worker pool from a manifest.
 * Keys are logical names (e.g. 'watch'); path convention \`${name}/worker.mjs\` mirrors tsup output
 */
export function createWorkerPool<T extends ThreadPoolManifest>(manifest: T) {
  const WORKERS = Object.fromEntries(
    Object.keys(manifest).map(name => [name, resolveCoreDistPath(`${name}/worker.mjs`)])
  ) as Record<keyof T & string, string>

  return {
    WORKERS,
    runWorker: (
      worker: keyof T | string,
      payload: unknown,
      options?: RunWorkerOptions
    ) => {
      const path =
        typeof worker === 'string' && worker in WORKERS ? WORKERS[worker] : worker
      const name = typeof worker === 'string' ? worker : 'worker'
      return runPoolWorker(path as string, payload, options).catch((err: unknown) => {
        // Piscina rejects long-lived worker tasks during pool.destroy(); that's expected shutdown.
        if (isExpectedShutdownError(err)) {
          return
        }
        log.error(`[${name}] Worker failed:`, err)
      })
    },
  }
}
