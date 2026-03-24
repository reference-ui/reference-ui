import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import {
  resolveCorePackageDir,
  resolveCorePackageDirForBuild,
} from '../../../lib/paths'
import { getOutDirPath } from '../../../lib/paths/out-dir'
import { writeGeneratedReactTypes, writeGeneratedSystemTypes } from '../../../system/types/generate'
import { getPackageDir, getDeclarationBasename } from '../../layout'
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
  const cliDir = resolveCorePackageDir(cwd)
  const cliDirForBuild = resolveCorePackageDirForBuild(cwd)
  const outDir = getOutDirPath(cwd)
  mkdirSync(outDir, { recursive: true })

  for (const pkg of packages) {
    const targetDir = getPackageDir(outDir, pkg.name)
    await installPackageTs(cliDir, cliDirForBuild, cwd, targetDir, pkg)
  }

  const systemDir = getPackageDir(outDir, '@reference-ui/system')
  const systemTypesPath = resolve(systemDir, getDeclarationBasename('system.mjs'))
  const reactDir = getPackageDir(outDir, '@reference-ui/react')
  const reactTypesPath = resolve(reactDir, getDeclarationBasename('react.mjs'))

  await writeGeneratedSystemTypes(cwd, systemTypesPath)
  await writeGeneratedReactTypes(cwd, reactTypesPath)
}
