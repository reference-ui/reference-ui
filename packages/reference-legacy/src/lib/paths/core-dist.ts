import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveCorePackageDir } from './core-package-dir'

/**
 * Resolve a path under dist/cli (e.g. worker modules).
 */
export function resolveCoreDistPath(relativePath: string): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url))
  return resolve(resolveCorePackageDir(moduleDir), 'dist/cli', relativePath)
}
