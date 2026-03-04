import { on } from '../event-bus'
import { KEEP_ALIVE } from '../thread-pool'
import { runBundle, onPandaCssCompiled, onSystemCompiled } from './run'
import type { PackagerWorkerPayload } from './run'

/**
 * Packager worker - bundles and installs packages to node_modules.
 *
 * Runs initial bundle on startup (cold and watch) so @reference-ui/system exists
 * before system worker runs eval. User files (e.g. tokens.ts) import from
 * @reference-ui/system; eval must resolve that before processing.
 *
 * In watch mode: after initial bundle, also listens for system:compiled (full
 * rebundle) and panda:css:compiled (styles only).
 */
export async function runPackager(payload: PackagerWorkerPayload): Promise<void> {
  const { watchMode = false } = payload

  // Initial bundle so @reference-ui/system exists before system worker runs eval
  await runBundle(payload)

  if (watchMode) {
    on('panda:css:compiled', onPandaCssCompiled(payload))
    on('system:compiled', onSystemCompiled(payload))
    return KEEP_ALIVE
  }
}

export type { PackagerWorkerPayload }
export default runPackager
