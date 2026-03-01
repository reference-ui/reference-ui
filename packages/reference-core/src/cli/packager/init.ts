import { runWorker } from '../thread-pool'
import type { SyncPayload } from '../sync/types'

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
export async function initPackager(payload: SyncPayload): Promise<void> {
  const watchMode = payload.options.watch ?? false
  if (watchMode) {
    runWorker('packager', {
      cwd: payload.cwd,
      config: payload.config,
      watchMode: true,
    })
  } else {
    await runWorker('packager', {
      cwd: payload.cwd,
      config: payload.config,
      watchMode: false,
    })
  }
}
