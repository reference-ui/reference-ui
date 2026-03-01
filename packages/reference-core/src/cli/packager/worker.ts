import { on } from '../event-bus'
import { KEEP_ALIVE } from '../thread-pool'
import { runBundle, onPandaCssCompiled, onSystemCompiled } from './run'
import type { PackagerWorkerPayload } from './run'

/**
 * Packager worker - bundles and installs packages to node_modules.
 * Listens for system:compiled (full bundle) and panda:css:compiled (styles only).
 *
 * In watch mode: does NOT run initial bundle. Waits for system:compiled so Panda
 * has generated src/system/* before bundling. Fixes race where packager-ts would
 * fail with MISSING_EXPORT (splitProps, h1Style, etc.) when bundle ran too early.
 */
export async function runPackager(payload: PackagerWorkerPayload): Promise<void> {
  const { watchMode = false } = payload

  if (watchMode) {
    on('panda:css:compiled', onPandaCssCompiled(payload))
    on('system:compiled', onSystemCompiled(payload))
    return KEEP_ALIVE
  }

  await runBundle(payload)
}

export type { PackagerWorkerPayload }
export default runPackager
