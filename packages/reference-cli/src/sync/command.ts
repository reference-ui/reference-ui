import { log } from '../lib/log'
import { syncWorkers } from '../lib/thread-pool'

export type SyncOptions = {
  watch?: boolean
}

const DEFAULT_INCLUDE = ['**/*.ts', '**/*.tsx', '**/*.css', '**/*.json']

/**
 * Sync command – main hub for the design system build pipeline.
 * Owns event flow, worker orchestration, and pipeline coordination.
 */
export async function syncCommand(
  cwd: string,
  options?: SyncOptions
): Promise<void> {
  log.info('hello world')

  if (options?.watch) {
    syncWorkers.runWorker('watch', {
      sourceDir: cwd,
      config: { include: DEFAULT_INCLUDE },
    }).catch((err) => log.error('[watch]', err))
    // Keep process alive
    await new Promise(() => {})
  }
}
