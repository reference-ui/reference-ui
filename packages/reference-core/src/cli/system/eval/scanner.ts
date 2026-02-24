import { existsSync, readFileSync } from 'node:fs'
import fg from 'fast-glob'
import { REGISTERED_FUNCTIONS } from './registry'
import { log } from '../../lib/log'

/**
 * Find files that contain calls to any registered function.
 * Uses regex to match function call patterns (e.g., "functionName(" or "functionName  (")
 * to avoid false positives from comments, strings, or type names.
 */
function scanDirectory(dir: string): string[] {
  if (!existsSync(dir)) {
    return []
  }

  const files = fg.sync('**/*.{ts,tsx}', {
    cwd: dir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/*.d.ts'],
  })

  const matches: string[] = []
  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    // Check if any registered function is called (matches word boundary + optional whitespace + open paren)
    const foundFunctions: string[] = []
    const hasAny = REGISTERED_FUNCTIONS.some(name => {
      const callPattern = new RegExp(`\\b${name}\\s*\\(`)
      const found = callPattern.test(content)
      if (found) foundFunctions.push(name)
      return found
    })
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

/**
 * Scan for files that call pattern() (box pattern extensions).
 * Matches \bpattern\s*\( to avoid matching patterns()
 */
export function scanForBoxExtensions(dirs: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  const patternCallRe = /\bpattern\s*\(/
  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    const files = fg.sync('**/*.{ts,tsx}', {
      cwd: dir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/*.d.ts'],
    })
    for (const file of files) {
      if (seen.has(file)) continue
      const content = readFileSync(file, 'utf-8')
      if (patternCallRe.test(content)) {
        seen.add(file)
        result.push(file)
      }
    }
  }
  return result
}
