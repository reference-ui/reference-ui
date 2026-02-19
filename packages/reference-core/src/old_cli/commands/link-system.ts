import { resolveCorePackageDir } from '../workspace/resolve-core'
import { linkLocalSystem } from '../internal/link-local-system'

export async function linkSystemCommand(cwd: string): Promise<void> {
  const coreDir = resolveCorePackageDir()
  linkLocalSystem(coreDir, cwd)
}
