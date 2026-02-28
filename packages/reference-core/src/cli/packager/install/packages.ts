import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import type { PackageDefinition } from '../package'
import { installPackage } from './package'

/**
 * Install packages to node_modules. When ENABLE_REFERENCE_UI_SYMLINKS is true:
 * output to .reference-ui/ and symlink into node_modules (for Vite HMR). When false: output
 * directly to node_modules.
 */
export async function installPackages(
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
