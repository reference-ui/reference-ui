import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import {
  resolveCorePackageDir,
  resolveCorePackageDirForBuild,
} from '../../lib/resolve-core'
import { installPackageTs } from './package'
import type { TsPackageInput } from './package'

/**
 * Install types for all packages.
 * Compiles declarations and writes to node_modules/@reference-ui/*.
 */
export async function installPackagesTs(
  cwd: string,
  packages: TsPackageInput[]
): Promise<void> {
  const coreDir = resolveCorePackageDir(cwd)
  const buildCoreDir = resolveCorePackageDirForBuild(cwd)
  const scopeDir = resolve(cwd, 'node_modules', '@reference-ui')
  mkdirSync(scopeDir, { recursive: true })

  for (const pkg of packages) {
    await installPackageTs(coreDir, buildCoreDir, cwd, pkg)
  }
}
