import { on } from '../event-bus'
import { runBundle, onPandaCssCompiled, onSystemCompiled } from './run'
import type { PackagerWorkerPayload } from './run'

/**
 * Packager worker - bundles and installs packages to node_modules.
 * Listens for system:compiled (full bundle) and panda:css:compiled (styles only).
 */
export async function runPackager(payload: PackagerWorkerPayload): Promise<void> {
  const { watchMode = false } = payload

  await runBundle(payload)

  if (watchMode) {
    on('panda:css:compiled', onPandaCssCompiled(payload))
    on('system:compiled', onSystemCompiled(payload))
    return new Promise(() => {})
  }
}

export type { PackagerWorkerPayload }
export default runPackager
