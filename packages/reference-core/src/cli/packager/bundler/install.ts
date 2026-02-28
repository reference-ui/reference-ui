import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import { log } from '../../lib/log'
import { createSymlink, removeSymlinkOrDir } from './symlink'
import type { PackageDefinition } from '../packages'
import { bundlePackage } from './index'

/** Set to false to skip symlinking .reference-ui/* into node_modules/@reference-ui/* */
export const ENABLE_REFERENCE_UI_SYMLINKS = true

function getShortName(pkgName: string): string {
  const scope = pkgName.indexOf('/')
  return scope >= 0 ? pkgName.slice(scope + 1) : pkgName
}

async function installPackage(
  coreDir: string,
  refUiDir: string,
  refUiScopeDir: string,
  pkg: PackageDefinition
): Promise<void> {
  const shortName = getShortName(pkg.name)
  const targetDir = ENABLE_REFERENCE_UI_SYMLINKS
    ? resolve(refUiDir, shortName)
    : resolve(refUiScopeDir, shortName)
  const linkPath = resolve(refUiScopeDir, shortName)

  if (ENABLE_REFERENCE_UI_SYMLINKS) {
    mkdirSync(refUiDir, { recursive: true })
  } else {
    removeSymlinkOrDir(linkPath)
  }

  await bundlePackage({ coreDir, targetDir, pkg })

  if (ENABLE_REFERENCE_UI_SYMLINKS) {
    createSymlink(targetDir, linkPath)
    log.debug('packager', `✓ ${pkg.name} → ${linkPath}`)
  } else {
    log.debug('packager', `✓ ${pkg.name} → ${targetDir}`)
  }
}

/**
 * Install all packages to node_modules. When ENABLE_REFERENCE_UI_SYMLINKS is true:
 * output to .reference-ui/ and symlink into node_modules (for Vite HMR). When false: output
 * directly to node_modules.
 */
export async function installAllPackages(
  coreDir: string,
  userProjectDir: string,
  packages: PackageDefinition[]
): Promise<void> {
  const refUiDir = resolve(userProjectDir, '.reference-ui')
  const refUiScopeDir = resolve(userProjectDir, 'node_modules', '@reference-ui')
  mkdirSync(refUiScopeDir, { recursive: true })

  for (const pkg of packages) {
    await installPackage(coreDir, refUiDir, refUiScopeDir, pkg)
  }
}
