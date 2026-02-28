import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import { log } from '../../lib/log'
import { createSymlink, removeSymlinkOrDir } from './symlink'
import type { PackageDefinition } from '../packages'
import { bundlePackage } from '../bundler'

/** Set to false to skip symlinking .reference-ui/* into node_modules/@reference-ui/* */
export const ENABLE_REFERENCE_UI_SYMLINKS = true

function getShortName(pkgName: string): string {
  const scope = pkgName.indexOf('/')
  return scope >= 0 ? pkgName.slice(scope + 1) : pkgName
}

export async function installPackage(
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
