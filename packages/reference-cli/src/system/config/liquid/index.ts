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

function getLiquidDir(): string {
  try {
    const url = (import.meta as { url?: string }).url
    if (url) {
      return dirname(fileURLToPath(url))
    }
  } catch {
    /* ignore */
  }
  const cwd = process.cwd()
  const candidates = [
    join(cwd, 'packages/reference-cli/src/system/config/liquid'),
    join(cwd, 'src/system/config/liquid'),
  ]
  for (const dir of candidates) {
    if (existsSync(join(dir, 'panda.liquid'))) return dir
  }
  return candidates[0]!
}

const __dirname = getLiquidDir()

interface Templates {
  panda: string
  deepMerge: string
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
    deepMerge: readFileSync(join(__dirname, 'deepMerge.liquid'), 'utf-8'),
  }

  return cachedTemplates
}
