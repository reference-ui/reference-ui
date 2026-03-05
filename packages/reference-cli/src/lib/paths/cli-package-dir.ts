import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, parse } from 'node:path'

/**
 * Walk up from startDir to find package.json with the given name.
 */
function walkUpToPackage(startDir: string, packageName: string): string | null {
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
 * Resolve the @reference-ui/cli package directory.
 * Used by packager to find source files for bundling.
 */
export function resolveCliPackageDir(fromCwd: string = process.cwd()): string {
  const cliDir = walkUpToPackage(fromCwd, '@reference-ui/cli')
  if (cliDir) return cliDir

  // Fallback: monorepo workspace
  let dir = fromCwd
  const root = parse(dir).root
  while (dir !== root) {
    if (
      existsSync(resolve(dir, 'pnpm-workspace.yaml')) ||
      existsSync(resolve(dir, 'nx.json'))
    ) {
      const candidate = resolve(dir, 'packages/reference-cli')
      if (existsSync(resolve(candidate, 'package.json'))) return candidate
      break
    }
    dir = dirname(dir)
  }

  throw new Error('@reference-ui/cli package directory could not be resolved.')
}

/**
 * Prefer workspace CLI when the resolved CLI is in node_modules.
 * Tsdown emits .d.mts only when run from the workspace (proper tsconfig, deps).
 */
export function resolveCliPackageDirForBuild(fromCwd: string = process.cwd()): string {
  const resolved = resolveCliPackageDir(fromCwd)
  let dir = dirname(resolved)
  const root = parse(dir).root

  while (dir !== root) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      const workspaceCli = resolve(dir, 'packages/reference-cli')
      if (existsSync(resolve(workspaceCli, 'package.json'))) {
        return workspaceCli
      }
      break
    }
    dir = dirname(dir)
  }

  return resolved
}
