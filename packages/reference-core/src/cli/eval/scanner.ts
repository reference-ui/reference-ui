import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { REGISTERED_FUNCTIONS } from './registry'

const require = createRequire(import.meta.url)
const fg = require('fast-glob')

/**
 * Find files that contain calls to any registered function.
 * Uses a simple substring search; not full AST. Files may match if the name
 * appears in comments or strings, but that's acceptable for a first pass.
 */
function scanDirectory(dir: string): string[] {
  if (!existsSync(dir)) return []
  const files = fg.sync('**/*.{ts,tsx}', {
    cwd: dir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/*.d.ts'],
  })

  const matches: string[] = []
  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const hasAny = REGISTERED_FUNCTIONS.some((name) => content.includes(name))
    if (hasAny) {
      matches.push(file)
    }
  }

  return matches
}

/**
 * Scan multiple directories and return deduplicated file paths.
 */
export function scanDirectories(dirs: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const dir of dirs) {
    for (const file of scanDirectory(dir)) {
      if (!seen.has(file)) {
        seen.add(file)
        result.push(file)
      }
    }
  }
  return result
}
