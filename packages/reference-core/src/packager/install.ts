import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import { log } from '../lib/log'
import { getOutDirPath } from '../lib/paths'
import { createSymlink, pruneBrokenSymlinksInDir } from '../lib/symlink'
import { getConfig } from '../config'
import { getPackageDir } from './layout'
import { type PackageDefinition } from './package'
import { bundlePackage } from './bundler'
import { runPostprocess } from './postprocess'

/**
 * Give each generated package instance a stable, project-scoped version identity.
 *
 * This avoids tsserver conflating independently generated copies of the same
 * package name/version across different projects in the monorepo.
 */
function createGeneratedPackageVersion(userProjectDir: string, pkg: PackageDefinition): string {
  const hash = createHash('sha256')
    .update(userProjectDir)
    .update('\0')
    .update(pkg.name)
    .digest('hex')
    .slice(0, 8)

  return `${pkg.version}-${hash}`
}

/**
 * Install a single package to outDir (e.g. .reference-ui/react/) and symlink into node_modules.
 * Builds package contents, runs any declared postprocess steps, then creates the symlink.
 */
export async function installPackage(
  coreDir: string,
  userProjectDir: string,
  outDir: string,
  nodeModulesScope: string,
  pkg: PackageDefinition
): Promise<void> {
  const targetDir = getPackageDir(outDir, pkg.name)
  const linkPath = getPackageDir(nodeModulesScope, pkg.name)
  const installPkg = {
    ...pkg,
    version: createGeneratedPackageVersion(userProjectDir, pkg),
  }

  mkdirSync(outDir, { recursive: true })
  mkdirSync(nodeModulesScope, { recursive: true })

  await bundlePackage({ coreDir, outDir, targetDir, pkg: installPkg })
  runPostprocess(targetDir, installPkg, { layerName: getConfig()?.name ?? '' })

  createSymlink(targetDir, linkPath)

  log.debug('packager', `✓ ${pkg.name} → ${linkPath}`)
}

/**
 * Install all packages to outDir (.reference-ui/) and symlink node_modules/@reference-ui/* → .reference-ui/*.
 * Enables module resolution for @reference-ui/react, @reference-ui/styled, @reference-ui/system.
 */
export async function installPackages(
  coreDir: string,
  userProjectDir: string,
  packages: PackageDefinition[]
): Promise<void> {
  const outDir = getOutDirPath(userProjectDir)
  const nodeModulesScope = resolve(userProjectDir, 'node_modules', '@reference-ui')

  for (const pkg of packages) {
    await installPackage(coreDir, userProjectDir, outDir, nodeModulesScope, pkg)
  }

  pruneBrokenSymlinksInDir(nodeModulesScope)
}
