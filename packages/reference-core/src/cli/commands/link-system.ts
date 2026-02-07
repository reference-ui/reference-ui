import { resolveCorePackageDir } from '../lib/resolve-core.js'
import { linkLocalSystem } from '../lib/link-local-system.js'

export async function linkSystemCommand(cwd: string): Promise<void> {
  const coreDir = resolveCorePackageDir()
  linkLocalSystem(coreDir, cwd)
}
