import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import {
  resolveCliPackageDir,
  resolveCliPackageDirForBuild,
} from '../../../lib/paths'
import { getOutDirPath } from '../../../lib/paths/out-dir'
import { getShortName } from '../../package/name'
import { installPackageTs } from './package'
import type { TsPackageInput } from '../types'

/**
 * Install types for all packages.
 * Compiles declarations and writes to outDir (e.g. .reference-ui/react/), then symlink exposes them.
 */
export async function installPackagesTs(
  cwd: string,
  packages: TsPackageInput[]
): Promise<void> {
  const cliDir = resolveCliPackageDir(cwd)
  const cliDirForBuild = resolveCliPackageDirForBuild(cwd)
  const outDir = getOutDirPath(cwd)
  mkdirSync(outDir, { recursive: true })

  for (const pkg of packages) {
    const shortName = getShortName(pkg.name)
    const targetDir = resolve(outDir, shortName)
    await installPackageTs(cliDir, cliDirForBuild, targetDir, pkg)
  }
}
