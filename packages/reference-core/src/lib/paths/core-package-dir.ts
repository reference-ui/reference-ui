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
 * Resolve the @reference-ui/core package directory.
 * Falls back to the legacy @reference-ui/cli name during the rename transition.
 */
export function resolveCorePackageDir(fromCwd: string = process.cwd()): string {
  const coreDir =
    walkUpToPackage(fromCwd, '@reference-ui/core') ??
    walkUpToPackage(fromCwd, '@reference-ui/cli')
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
    '@reference-ui/core package directory could not be resolved (legacy @reference-ui/cli also checked).'
  )
}

/**
 * Prefer the workspace package when the resolved package is in node_modules.
 * Tsdown emits .d.mts only when run from the workspace (proper tsconfig, deps).
 */
export function resolveCorePackageDirForBuild(fromCwd: string = process.cwd()): string {
  const resolved = resolveCorePackageDir(fromCwd)
  let dir = dirname(resolved)
  const root = parse(dir).root

  while (dir !== root) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      const workspaceCore = resolve(dir, 'packages/reference-core')
      if (existsSync(resolve(workspaceCore, 'package.json'))) {
        return workspaceCore
      }
      break
    }
    dir = dirname(dir)
  }

  return resolved
}
