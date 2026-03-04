import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, parse } from 'node:path'

/**
 * Walk up from startDir to find package.json with the given name.
 */
function walkUpToPackage(
  startDir: string,
  packageName: string
): string | null {
  let dir = startDir
  const root = parse(dir).root
  while (dir !== root) {
    const pkgPath = resolve(dir, 'package.json')
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      if (pkg.name === packageName) return dir
    }
    dir = dirname(dir)
  }
  return null
}

/**
 * Resolve the @reference-ui/core package directory.
 * Used by packager to find source files for bundling.
 */
export function resolveCorePackageDir(fromCwd: string = process.cwd()): string {
  // Try walking up from cwd
  const coreDir = walkUpToPackage(fromCwd, '@reference-ui/core')
  if (coreDir) return coreDir

  // Fallback: monorepo workspace
  let dir = fromCwd
  const root = parse(dir).root
  while (dir !== root) {
    if (
      existsSync(resolve(dir, 'pnpm-workspace.yaml')) ||
      existsSync(resolve(dir, 'nx.json'))
    ) {
      const candidate = resolve(dir, 'packages/reference-core')
      if (existsSync(resolve(candidate, 'package.json'))) return candidate
      break
    }
    dir = dirname(dir)
  }

  throw new Error(
    '@reference-ui/core package directory could not be resolved.'
  )
}
