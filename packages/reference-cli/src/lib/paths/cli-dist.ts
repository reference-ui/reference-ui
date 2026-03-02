import { resolve } from 'node:path'
import { resolveCliPackageDir } from './cli-package-dir'

/**
 * Resolve a path under dist/cli (e.g. worker modules).
 */
export function resolveCliDistPath(relativePath: string): string {
  return resolve(resolveCliPackageDir(), 'dist/cli', relativePath)
}
