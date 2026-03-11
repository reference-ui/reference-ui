import { resolve } from 'node:path'
import type { PackageDefinition } from '../package'
import { writeIfChanged } from './files'

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
 * Generate and write package.json for a bundled package
 */
export function writePackageJson(targetDir: string, pkg: PackageDefinition): void {
  const packageJson = createPackageJson(pkg)
  writeIfChanged(resolve(targetDir, 'package.json'), JSON.stringify(packageJson, null, 2))
}
