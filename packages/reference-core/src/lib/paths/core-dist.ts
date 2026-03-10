import { resolve } from 'node:path'
import { resolveCorePackageDir } from './core-package-dir'

/**
 * Resolve a path under dist/cli (e.g. worker modules).
 */
export function resolveCoreDistPath(relativePath: string): string {
  return resolve(resolveCorePackageDir(), 'dist/cli', relativePath)
}
