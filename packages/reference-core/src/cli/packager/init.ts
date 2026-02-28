import type { ReferenceUIConfig } from '../config'
import { runWorker } from '../thread-pool'

export interface InitPackagerOptions {
  watch?: boolean
}

/**
 * Initialize the packager system.
 *
 * Creates bundled packages for:
 * - @reference-ui/system (design tokens, CSS utilities)
 * - @reference-ui/react (components, runtime APIs)
 *
 * Uses esbuild to properly bundle and place packages in node_modules.
 *
 * In watch mode, starts the worker but returns immediately (non-blocking).
 * In cold start mode, waits for the initial bundle to complete.
 */
export async function initPackager(
  cwd: string,
  config: ReferenceUIConfig,
  options?: InitPackagerOptions
): Promise<void> {
  const watchMode = options?.watch ?? false
  if (watchMode) {
    runWorker('packager', { cwd, config, watchMode: true })
  } else {
    await runWorker('packager', { cwd, config, watchMode: false })
  }
}
