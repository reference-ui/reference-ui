import { existsSync, readFileSync } from 'node:fs'
import fg from 'fast-glob'
import { REGISTERED_FUNCTIONS } from './registry'

/**
 * Scan a single directory for files that call any registered function.
 * Uses a word-boundary + open-paren regex to avoid false positives from
 * comments, type names, or variable names.
 */
function scanDir(dir: string): string[] {
  if (!existsSync(dir)) return []

  const files = fg.sync('**/*.{ts,tsx}', {
    cwd: dir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/*.d.ts'],
  })

  const patterns = REGISTERED_FUNCTIONS.map(
    (name) => new RegExp(`\\b${name}\\s*\\(`)
  )

  return files.filter((file) => {
    const content = readFileSync(file, 'utf-8')
    return patterns.some((re) => re.test(content))
  })
}

/**
 * Scan multiple directories and return deduplicated absolute file paths.
 */
export function scanDirectories(dirs: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const dir of dirs) {
    for (const file of scanDir(dir)) {
      if (!seen.has(file)) {
        seen.add(file)
        result.push(file)
      }
    }
  }
  return result
}
