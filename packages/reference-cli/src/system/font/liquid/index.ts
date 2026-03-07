/**
 * Liquid template loader for font generation.
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
    join(cwd, 'packages/reference-cli/src/system/font/liquid'),
    join(cwd, 'src/system/font/liquid'),
  ]
  for (const dir of candidates) {
    if (existsSync(join(dir, 'tokens.liquid'))) return dir
  }
  return candidates[0]!
}

const __dirname = getLiquidDir()

export interface FontTemplates {
  tokens: string
  fontface: string
  recipe: string
  pattern: string
}

let cachedTemplates: FontTemplates | null = null

export function loadFontTemplates(): FontTemplates {
  if (cachedTemplates) return cachedTemplates
  cachedTemplates = {
    tokens: readFileSync(join(__dirname, 'tokens.liquid'), 'utf-8'),
    fontface: readFileSync(join(__dirname, 'fontface.liquid'), 'utf-8'),
    recipe: readFileSync(join(__dirname, 'recipe.liquid'), 'utf-8'),
    pattern: readFileSync(join(__dirname, 'pattern.liquid'), 'utf-8'),
  }
  return cachedTemplates
}
