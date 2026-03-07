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
    join(cwd, 'packages/reference-cli/src/system/patterns/liquid'),
    join(cwd, 'src/system/patterns/liquid'),
  ]
  for (const dir of candidates) {
    if (existsSync(join(dir, 'box-pattern.liquid'))) return dir
  }
  return candidates[0]!
}

const __dirname = getLiquidDir()

interface PatternTemplates {
  boxPattern: string
}

let cachedTemplates: PatternTemplates | null = null

/**
 * Load pattern Liquid templates. Cached after first load.
 */
export function loadPatternTemplates(): PatternTemplates {
  if (cachedTemplates) return cachedTemplates
  cachedTemplates = {
    boxPattern: readFileSync(join(__dirname, 'box-pattern.liquid'), 'utf-8'),
  }
  return cachedTemplates
}
