import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import {
  resolveCliPackageDir,
  resolveCliPackageDirForBuild,
} from '../../../lib/paths'
import { getOutDirPath } from '../../../lib/paths/out-dir'
import { writeGeneratedReactTypes, writeGeneratedSystemTypes } from '../../../system/types/generate'
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

  const systemDir = resolve(outDir, getShortName('@reference-ui/system'))
  const systemTypesPath = resolve(systemDir, 'system.d.mts')
  const reactDir = resolve(outDir, getShortName('@reference-ui/react'))
  const reactTypesPath = resolve(reactDir, 'react.d.mts')

  await writeGeneratedSystemTypes(cwd, systemTypesPath)
  await writeGeneratedReactTypes(cwd, reactTypesPath)
}
