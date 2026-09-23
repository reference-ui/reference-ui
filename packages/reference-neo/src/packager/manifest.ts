// Manifest writer for Neo generated packages.
// It takes a target dir plus a package definition and emits the package.json published beside each bundle.
// The write is unconditional: sync rm-wipes the output dir first, so change-gating the write would be dead code.

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PackageDefinition } from './package/index.ts'

const DEFAULT_MAIN = './index.js'
const DEFAULT_TYPES = './index.d.ts'

function createPackageJson(pkg: PackageDefinition) {
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    type: 'module',
    main: pkg.main || DEFAULT_MAIN,
    types: pkg.types || DEFAULT_TYPES,
    exports: pkg.exports,
  }
}

/**
 * Generate and write package.json for a packaged bundle.
 */
export function writePackageJson(targetDir: string, pkg: PackageDefinition): void {
  const packageJson = createPackageJson(pkg)
  writeFileSync(resolve(targetDir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')
}
