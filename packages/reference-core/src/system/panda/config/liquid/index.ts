/**
 * Liquid template loader and cache.
 * Provides typed access to template files with caching.
 *
 * Uses import.meta.url when available (ESM). When bundled as IIFE (e.g. fragment
 * bundles), import.meta may be empty — fallback to path relative to process.cwd().
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

function hasTemplates(dir: string): boolean {
  return existsSync(join(dir, 'panda.liquid'))
}

function* ancestorDirs(startDir: string): Generator<string> {
  let current = startDir
  while (true) {
    yield current
    const parent = dirname(current)
    if (parent === current) {
      break
    }
    current = parent
  }
}

function getLiquidDir(): string {
  const searchRoots: string[] = []

  try {
    const url = (import.meta as { url?: string }).url
    if (url) {
      searchRoots.push(dirname(fileURLToPath(url)))
    }
  } catch {
    /* ignore */
  }

  searchRoots.push(process.cwd())

  for (const root of searchRoots) {
    for (const dir of ancestorDirs(root)) {
      const candidates = [
        join(dir, 'packages/reference-core/src/system/panda/config/liquid'),
        join(dir, 'src/system/panda/config/liquid'),
      ]

      for (const candidate of candidates) {
        if (hasTemplates(candidate)) {
          return candidate
        }
      }
    }
  }

  return join(process.cwd(), 'packages/reference-core/src/system/panda/config/liquid')
}

const __dirname = getLiquidDir()

interface Templates {
  panda: string
}

let cachedTemplates: Templates | null = null

/**
 * Load and cache Liquid templates.
 * Templates are loaded from disk on first call and cached in memory.
 */
export function loadTemplates(): Templates {
  if (cachedTemplates) {
    return cachedTemplates
  }

  cachedTemplates = {
    panda: readFileSync(join(__dirname, 'panda.liquid'), 'utf-8'),
  }

  return cachedTemplates
}
