import { workers } from '../lib/thread-pool'

export interface PackagerInitPayload {
  cwd: string
  watchMode?: boolean
}

/**
 * Initialize the packager worker.
 *
 * Creates bundled packages for:
 * - @reference-ui/system (design tokens, CSS utilities)
 * - @reference-ui/react (components, runtime APIs)
 *
 * Uses esbuild to bundle and place packages in outDir.
 */
export async function initPackager(payload: PackagerInitPayload): Promise<void> {
  await workers.runWorker('packager', payload)
}
