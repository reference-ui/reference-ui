import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, join, relative, parse } from 'node:path'
import { createRequire } from 'node:module'

const CONFIG_FILES = ['reference.config.ts', 'reference.config.js', 'reference.config.mjs']

export function resolvePackageRoot(startCwd: string = process.cwd()): string {
  let dir = resolve(startCwd)
  const root = dirname(dir)
  while (dir !== root) {
    if (CONFIG_FILES.some((f) => existsSync(resolve(dir, f)))) {
      return dir
    }
    try {
      const pkgPath = resolve(dir, 'package.json')
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.reference != null || pkg.dependencies?.['@reference-ui/core'] != null) {
          return dir
        }
      }
    } catch {
      // ignore
    }
    dir = dirname(dir)
  }
  return startCwd
}

export function readCoreSourceFiles(coreDir: string): Record<string, string> {
  const sourceFiles: Record<string, string> = {}

  // Core src + src/system for consumer materialization.
  const roots: Array<{ dir: string; base: string; exts?: string[] }> = [
    { dir: resolve(coreDir, 'src'), base: '', exts: ['.ts'] },
    { dir: resolve(coreDir, 'src/system'), base: 'system' },
    { dir: resolve(coreDir), base: '', exts: ['.ts'] },
  ]

  function readDirRecursive(dir: string, rootDir: string, basePrefix: string, exts?: string[]): void {
    if (!existsSync(dir)) return
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stats = statSync(fullPath)

      if (stats.isDirectory()) {
        if (entry === 'node_modules' || entry === 'dist' || entry === 'cli') continue
        readDirRecursive(fullPath, rootDir, basePrefix, exts)
        continue
      }

      if (!stats.isFile()) continue

      const rel = relative(rootDir, fullPath).replace(/\\/g, '/')
      const logicalPath = basePrefix ? `${basePrefix}/${rel}` : rel

      if (exts && !exts.some((ext) => fullPath.endsWith(ext))) continue

      sourceFiles[logicalPath] = readFileSync(fullPath, 'utf-8')
    }
  }

  for (const root of roots) {
    readDirRecursive(root.dir, root.dir, root.base, root.exts)
  }

  return sourceFiles
}

export function resolveCorePackageDir(): string {
  const fromCwd = process.cwd()

  // Prefer Node module resolution (monorepos).
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
    // fall through
  }

  // Fallback: workspace root + monorepo paths.
  let dir = fromCwd
  const root = dirname(dir)

  while (dir !== root) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml')) || existsSync(resolve(dir, 'nx.json'))) {
      const candidate = resolve(dir, 'packages/reference-core')
      if (existsSync(resolve(candidate, 'package.json'))) return candidate
      const alt = resolve(dir, 'packages/old/reference-core')
      if (existsSync(resolve(alt, 'package.json'))) return alt
      break
    }
    dir = dirname(dir)
  }

  throw new Error(
    'Core package directory could not be resolved. Ensure that @reference-ui/core is installed or present in the workspace.'
  )
}
