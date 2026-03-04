/**
 * Liquid template loader and cache.
 * Provides typed access to template files with caching.
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
