import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, parse } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_JSON = 'package.json'
const CORE_PACKAGE_NAME = '@reference-ui/core'
const WORKSPACE_MARKERS = ['pnpm-workspace.yaml', 'nx.json'] as const
const WORKSPACE_CORE_PATH = ['packages', 'reference-core'] as const

/**
 * Walk up from startDir to find package.json with the given name.
 */
function walkUpToPackage(startDir: string, packageName: string): string | null {
  let dir = startDir
  const root = parse(dir).root
  while (dir !== root) {
    const pkgPath = resolve(dir, PACKAGE_JSON)
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      if (pkg.name === packageName) return dir
    }
    dir = dirname(dir)
  }
  return null
}

function resolveCurrentModuleDir(): string {
  return dirname(fileURLToPath(import.meta.url))
}

/**
 * Resolve the @reference-ui/core package directory.
 */
export function resolveCorePackageDir(fromCwd: string = process.cwd()): string {
  const coreDir = walkUpToPackage(fromCwd, CORE_PACKAGE_NAME)
  if (coreDir) return coreDir

  // Fallback: monorepo workspace
  let dir = fromCwd
  const root = parse(dir).root
  while (dir !== root) {
    if (
      WORKSPACE_MARKERS.some((marker) => existsSync(resolve(dir, marker)))
    ) {
      const candidate = resolve(dir, ...WORKSPACE_CORE_PATH)
      if (existsSync(resolve(candidate, PACKAGE_JSON))) return candidate
      break
    }
    dir = dirname(dir)
  }

  const installedCoreDir = walkUpToPackage(
    resolveCurrentModuleDir(),
    CORE_PACKAGE_NAME
  )
  if (installedCoreDir) return installedCoreDir

  throw new Error(
    '@reference-ui/core package directory could not be resolved.'
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
    if (existsSync(resolve(dir, WORKSPACE_MARKERS[0]))) {
      const workspaceCore = resolve(dir, ...WORKSPACE_CORE_PATH)
      if (existsSync(resolve(workspaceCore, PACKAGE_JSON))) {
        return workspaceCore
      }
      break
    }
    dir = dirname(dir)
  }

  return resolved
}
