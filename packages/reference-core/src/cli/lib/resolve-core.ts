import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, parse } from 'node:path'
import { createRequire } from 'node:module'

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

    let dir = dirname(entry)
    const fsRoot = parse(dir).root
    while (dir !== fsRoot) {
      const pkgPath = resolve(dir, 'package.json')
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.name === '@reference-ui/core') return dir
      }
      dir = dirname(dir)
    }
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
