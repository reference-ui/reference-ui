import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../lib/log'
import { getOutDirPath } from '../lib/paths'
import { pruneBrokenSymlinksInDir, removeSymlinkOrDir } from '../lib/symlink'
import { getConfig } from '../config'
import { getPackageDir } from './layout'
import { type PackageDefinition } from './package'
import { bundlePackage } from './bundler'
import { runPostprocess } from './postprocess'
import { installBuildPackage } from './install/build'
import { installDevPackage } from './install/dev'

export type InstallMode = 'dev' | 'build'

export interface InstallPackageOptions {
  /**
   * Install mode is explicit so dev/watch flows and build/test flows do not
   * fight over whether node_modules should be symlinked or copied.
   */
  mode?: InstallMode
}


/**
 * Give each generated package instance a stable, project-scoped version identity.
 *
 * This is essential because multiple packages in the monorepo can each generate
 * their own local copy of packages like `@reference-ui/react`. If those copies
 * all share the same name + version, TypeScript/tsserver can conflate them as
 * the same package identity during declaration resolution, navigation, and type
 * caching, which causes cross-package leakage and "wrong package" resolution.
 *
 * The short hash keeps identity deterministic for a given project/package pair
 * while making separately generated copies distinct.
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
 * Install a single package to outDir (e.g. .reference-ui/react/) and publish it into node_modules.
 *
 * Build mode publishes a real directory copy so generated packages behave like
 * normal installed dependencies. Dev mode intentionally keeps node_modules
 * symlinked to `.reference-ui/` so consumer bundlers and tsserver see live
 * package updates immediately.
 */
export async function installPackage(
  coreDir: string,
  userProjectDir: string,
  outDir: string,
  nodeModulesScope: string,
  pkg: PackageDefinition,
  options?: InstallPackageOptions
): Promise<void> {
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

  const installMode = options?.mode ?? 'dev'

  // The install target may currently be either a copied directory (one-shot)
  // or a symlink from a previous watch session. Remove it first so the mode can
  // flip cleanly in either direction.
  removeSymlinkOrDir(installPath)
  if (installMode === 'dev') {
    // Preserve a live link during dev mode: the generated package contents in
    // `.reference-ui/` are the source of truth, and downstream tooling needs to
    // observe those updates without waiting for node_modules to be recopied.
    installDevPackage(targetDir, installPath)
  } else {
    // Build mode publishes a real directory copy so generated packages are
    // self-contained snapshots and not tied to the lifecycle of `.reference-ui/`.
    installBuildPackage(targetDir, installPath)
  }

  log.debug('packager', `✓ ${pkg.name} → ${installPath}`)
}

/**
 * Install all packages to outDir (.reference-ui/) and publish node_modules/@reference-ui/* from it.
 * Enables module resolution for @reference-ui/react, @reference-ui/styled, @reference-ui/system.
 */
export async function installPackages(
  coreDir: string,
  userProjectDir: string,
  packages: PackageDefinition[],
  options?: InstallPackageOptions
): Promise<void> {
  const outDir = getOutDirPath(userProjectDir)
  const nodeModulesScope = resolve(userProjectDir, 'node_modules', '@reference-ui')

  for (const pkg of packages) {
    await installPackage(coreDir, userProjectDir, outDir, nodeModulesScope, pkg, options)
  }

  pruneBrokenSymlinksInDir(nodeModulesScope)
}
