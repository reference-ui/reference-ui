import { existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const pkgRoot = resolve(__dirname, '..', '..')
export const virtualDir = join(pkgRoot, '.reference-ui', 'virtual')
export const srcDir = join(pkgRoot, 'src')
export const testsDir = join(pkgRoot, 'tests')

export const virt = (...pathSegments: string[]) => join(virtualDir, ...pathSegments)

const ignoredSourceDirs = new Set(['.reference-ui', 'node_modules'])

export async function waitFor(
  predicate: () => boolean,
  options: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<boolean> {
  const { intervalMs = 80, timeoutMs = 4_000 } = options
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (predicate()) {
      return true
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, intervalMs))
  }

  return false
}

function* walkFiles(dir: string, base = dir): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (ignoredSourceDirs.has(name)) {
      continue
    }

    const path = join(dir, name)
    let stat

    try {
      stat = statSync(path)
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue
      }

      throw error
    }

    if (stat.isDirectory()) {
      yield* walkFiles(path, base)
    } else {
      yield relative(base, path)
    }
  }
}

export function getSourcePaths(): string[] {
  const output: string[] = []
  const roots = [
    ['src', srcDir],
    ['tests', testsDir],
  ] as const

  for (const [prefix, dir] of roots) {
    if (!existsSync(dir)) {
      continue
    }

    for (const relativePath of walkFiles(dir, dir)) {
      const extension = extname(relativePath)

      if (['.ts', '.tsx', '.mdx'].includes(extension)) {
        output.push(join(prefix, relativePath))
      }
    }
  }

  return output.sort((left, right) => left.localeCompare(right))
}

export function getVirtualPaths(): string[] {
  if (!existsSync(virtualDir)) {
    return []
  }

  return Array.from(walkFiles(virtualDir, virtualDir)).sort((left, right) => left.localeCompare(right))
}

export function virtualToPossibleSources(virtualRelativePath: string): string[] {
  const extension = extname(virtualRelativePath)
  const base = virtualRelativePath.slice(0, -extension.length)

  if (extension === '.jsx') {
    return [`${base}.jsx`, `${base}.mdx`]
  }

  return [virtualRelativePath]
}

export const extensionTransforms: Record<string, string> = {
  '.mdx': '.jsx',
  '.js': '.js',
  '.jsx': '.jsx',
  '.ts': '.ts',
  '.tsx': '.tsx',
}