import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import { log } from '../lib/log'
import { getOutDirPath } from '../lib/paths'
import { getShortName, type PackageDefinition } from './package'
import { bundlePackage } from './bundler'

/**
 * Install a single package to outDir (e.g., .reference-ui/react/)
 */
export async function installPackage(
  coreDir: string,
  outDir: string,
  pkg: PackageDefinition
): Promise<void> {
  const shortName = getShortName(pkg.name)
  const targetDir = resolve(outDir, shortName)

  mkdirSync(outDir, { recursive: true })

  await bundlePackage({ coreDir, targetDir, pkg })

  log.debug('packager', `✓ ${pkg.name} → ${targetDir}`)
}

/**
 * Install all packages to outDir (e.g., .reference-ui/react/, .reference-ui/system/)
 * Simple version: writes directly to outDir, no symlinks or extra nesting.
 */
export async function installPackages(
  coreDir: string,
  userProjectDir: string,
  packages: PackageDefinition[]
): Promise<void> {
  const outDir = getOutDirPath(userProjectDir)
  
  for (const pkg of packages) {
    await installPackage(coreDir, outDir, pkg)
  }
}
