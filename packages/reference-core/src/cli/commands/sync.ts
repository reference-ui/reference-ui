import { copyToNodeModules } from '../lib/copy-to-node-modules.js'
import { resolveCorePackageDir } from '../lib/resolve-core.js'
import { runTsdown } from '../lib/run-tsdown.js'

export async function syncCommand(cwd: string): Promise<void> {
  const coreDir = resolveCorePackageDir()
  await runTsdown(coreDir)
  copyToNodeModules(cwd, coreDir)
}
