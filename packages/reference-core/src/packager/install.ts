import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import { log } from '../lib/log'
import { getOutDirPath } from '../lib/paths'
import { createSymlink } from '../lib/symlink'
import { getConfig } from '../config'
import { getPackageDir } from './layout'
import { type PackageDefinition } from './package'
import { bundlePackage } from './bundler'
import { runPostprocess } from './postprocess'

/**
 * Install a single package to outDir (e.g. .reference-ui/react/) and symlink into node_modules.
 * Builds package contents, runs any declared postprocess steps, then creates the symlink.
 */
export async function installPackage(
  coreDir: string,
  outDir: string,
  nodeModulesScope: string,
  pkg: PackageDefinition
): Promise<void> {
  const targetDir = getPackageDir(outDir, pkg.name)
  const linkPath = getPackageDir(nodeModulesScope, pkg.name)

  mkdirSync(outDir, { recursive: true })
  mkdirSync(nodeModulesScope, { recursive: true })

  await bundlePackage({ coreDir, outDir, targetDir, pkg })
  runPostprocess(targetDir, pkg, { layerName: getConfig()?.name ?? '' })

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
    await installPackage(coreDir, outDir, nodeModulesScope, pkg)
  }
}
