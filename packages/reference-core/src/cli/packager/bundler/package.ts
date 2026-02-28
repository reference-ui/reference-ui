import { resolve } from 'node:path'
import type { PackageDefinition } from '../packages'
import { writeIfChanged } from './files'

/**
 * Generate and write package.json for a bundled package
 */
export function writePackageJson(targetDir: string, pkg: PackageDefinition): void {
  const packageJson = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    type: 'module',
    main: pkg.main || './index.js',
    types: pkg.types || './index.d.ts',
    exports: pkg.exports,
  }
  writeIfChanged(resolve(targetDir, 'package.json'), JSON.stringify(packageJson, null, 2))
}
