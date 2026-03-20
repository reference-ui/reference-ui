import { existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const pkgRoot = resolve(__dirname, '..', '..')
export const virtualDir = join(pkgRoot, '.reference-ui', 'virtual')
export const srcDir = join(pkgRoot, 'src')
export const testsDir = join(pkgRoot, 'tests')

export const virt = (...p: string[]) => join(virtualDir, ...p)

/** Poll until condition is met or timeout. Returns true if condition met. */
export async function waitFor(
  fn: () => boolean,
  opts: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<boolean> {
  const { intervalMs = 80, timeoutMs = 4000 } = opts
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (fn()) return true
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return false
}

function* walkFiles(dir: string, base = dir): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    let stat
    try {
      stat = statSync(path)
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue
      throw err
    }
    if (stat.isDirectory()) {
      yield* walkFiles(path, base)
    } else {
      yield relative(base, path)
    }
  }
}

export function getSourcePaths(): string[] {
  const out: string[] = []
  const roots = [
    ['src', srcDir],
    ['tests', testsDir],
  ] as const

  for (const [prefix, dir] of roots) {
    if (!existsSync(dir)) continue
    for (const rel of walkFiles(dir, dir)) {
      const ext = extname(rel)
      if (['.ts', '.tsx', '.mdx'].includes(ext)) {
        out.push(join(prefix, rel))
      }
    }
  }
  return out.sort((a, b) => a.localeCompare(b))
}

export function getVirtualPaths(): string[] {
  if (!existsSync(virtualDir)) return []
  const out: string[] = []
  for (const rel of walkFiles(virtualDir, virtualDir)) {
    out.push(rel)
  }
  return out.sort((a, b) => a.localeCompare(b))
}

export function virtualToPossibleSources(virtualRel: string): string[] {
  const ext = extname(virtualRel)
  const base = virtualRel.slice(0, -ext.length)
  if (ext === '.jsx') return [`${base}.jsx`, `${base}.mdx`]
  return [virtualRel]
}

export const EXTENSION_TRANSFORMS: Record<string, string> = {
  '.mdx': '.jsx',
  '.js': '.js',
  '.jsx': '.jsx',
  '.ts': '.ts',
  '.tsx': '.tsx',
}
