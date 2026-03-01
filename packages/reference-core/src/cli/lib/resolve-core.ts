import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, parse } from 'node:path'
import { createRequire } from 'node:module'

/**
 * Walk up the directory tree from startDir until finding a package.json with the given name.
 * @returns The directory containing the matching package.json, or null if not found.
 */
function walkUpToPackageJson(startDir: string, packageName: string): string | null {
  let dir = startDir
  const fsRoot = parse(dir).root
  while (dir !== fsRoot) {
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
 * This is where the virtual folder and other build artifacts will be created.
 *
 * Strategy:
 * 1. Use Node module resolution to find @reference-ui/core
 * 2. Walk up from the resolved entry point to find package.json with name '@reference-ui/core'
 * 3. Fallback to monorepo workspace detection
 */
export function resolveCorePackageDir(fromCwd: string = process.cwd()): string {
  // Prefer Node module resolution (works in installed packages)
  try {
    const req = createRequire(import.meta.url)
    const entry = req.resolve('@reference-ui/core')
    const dir = walkUpToPackageJson(dirname(entry), '@reference-ui/core')
    if (dir) return dir
  } catch {
    // fall through to monorepo detection
  }

  // Fallback: workspace root + monorepo paths
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
    '@reference-ui/core package directory could not be resolved. Ensure that @reference-ui/core is installed or present in the workspace.'
  )
}

/**
 * Prefer workspace reference-core when the resolved core is in node_modules.
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
