import type { ReferenceUIConfig } from '../config'
import { runWorker } from '../thread-pool'

export interface InitGenOptions {
  watch?: boolean
}

/**
 * Initialize the gen worker (Panda codegen / cssgen).
 *
 * Runs in a separate thread from system so eval + config generation
 * don't block Panda. System must run first (emits config:ready); gen
 * runs Panda on config:ready or on hot-path virtual:fs:change.
 *
 * In watch mode, starts the worker but returns immediately (non-blocking).
 * In cold start mode, waits for initial codegen to complete.
 */
export async function initGen(
  cwd: string,
  config: ReferenceUIConfig,
  options?: InitGenOptions
): Promise<void> {
  const watchMode = options?.watch ?? false
  if (watchMode) {
    runWorker('gen', { cwd, config, watchMode: true })
  } else {
    await runWorker('gen', { cwd, config, watchMode: false })
  }
}
