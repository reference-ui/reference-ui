import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, parse } from 'node:path'
import { fileURLToPath } from 'node:url'

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
 * Resolve the @reference-ui/cli package directory.
 * Used for worker paths and other runtime resolution.
 */
export function resolveCliPackageDir(fromCwd: string = process.cwd()): string {
  const selfDir = dirname(fileURLToPath(import.meta.url))

  const cliDir = walkUpToPackage(selfDir, '@reference-ui/cli')
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

  throw new Error(
    '@reference-ui/cli package directory could not be resolved.'
  )
}
