import { workers } from '../lib/thread-pool'
import type { SyncPayload } from '../sync/types'

/**
 * Initialize the packager worker.
 *
 * Creates bundled packages for:
 * - @reference-ui/system (design tokens, CSS utilities)
 * - @reference-ui/react (components, runtime APIs)
 *
 * Uses esbuild to bundle and place packages in outDir.
 */
export function initPackager(payload: SyncPayload): void {
  workers.runWorker('packager', {
    cwd: payload.cwd,
    watchMode: payload.options?.watch,
  })
}
