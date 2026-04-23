import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { getConfig } from '../../config'
import { log } from '../../lib/log'
import { getOutDirPath } from '../../lib/paths'
import { pruneBrokenSymlinksInDir } from '../../lib/symlink'
import { bundlePackage } from '../bundler'
import { getPackageDir } from '../layout'
import { type PackageDefinition } from '../package'
import { runPostprocess } from '../postprocess'
import { installBuildPackage } from './build'
import { installDevPackage } from './dev'

export type InstallMode = 'dev' | 'build'

interface InstallPackageOptions {
  coreDir: string
  userProjectDir: string
  outDir: string
  nodeModulesScope: string
  pkg: PackageDefinition
  installMode?: InstallMode
}

const INSTALLERS: Record<InstallMode, (targetDir: string, installPath: string) => void> = {
  build: installBuildPackage,
  dev: installDevPackage,
}

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
 * Install a single package to outDir (e.g. .reference-ui/react/) and publish it
 * into node_modules using the requested install mode.
 */
export async function installPackage(options: InstallPackageOptions): Promise<void> {
  const { coreDir, userProjectDir, outDir, nodeModulesScope, pkg, installMode = 'dev' } = options
  const targetDir = getPackageDir(outDir, pkg.name)
  const installPath = getPackageDir(nodeModulesScope, pkg.name)
  const installPkg = {
    ...pkg,
    version: createGeneratedPackageVersion(userProjectDir, pkg),
  }

  mkdirSync(outDir, { recursive: true })
  mkdirSync(nodeModulesScope, { recursive: true })

  await bundlePackage({ coreDir, outDir, targetDir, pkg: installPkg })
  runPostprocess(targetDir, installPkg, { layerName: getConfig()?.name ?? '' })

  INSTALLERS[installMode](targetDir, installPath)

  log.debug('packager', `✓ ${pkg.name} → ${installPath}`)
}

/**
 * Install all packages to outDir (.reference-ui/) and publish them into
 * node_modules/@reference-ui using the requested install mode.
 */
export async function installPackages(
  coreDir: string,
  userProjectDir: string,
  packages: PackageDefinition[],
  installMode: InstallMode = 'dev'
): Promise<void> {
  const outDir = getOutDirPath(userProjectDir)
  const nodeModulesScope = resolve(userProjectDir, 'node_modules', '@reference-ui')

  for (const pkg of packages) {
    await installPackage({
      coreDir,
      userProjectDir,
      outDir,
      nodeModulesScope,
      pkg,
      installMode,
    })
  }

  pruneBrokenSymlinksInDir(nodeModulesScope)
}