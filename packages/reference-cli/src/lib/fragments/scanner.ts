import { existsSync, readFileSync } from 'node:fs'
import fg from 'fast-glob'
import type { ScanOptions } from './types'

/**
 * Scan a single directory for files that call any of the specified functions.
 * Uses regex to match function call patterns (e.g., "functionName(" or "functionName  (")
 * to avoid false positives from comments, strings, or type names.
 */
function scanDirectory(
  dir: string,
  functionNames: string[],
  include: string[],
  exclude: string[]
): string[] {
  if (!existsSync(dir)) {
    return []
  }

  const files = fg.sync(include, {
    cwd: dir,
    absolute: true,
    ignore: exclude,
  })

  const matches: string[] = []
  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    // Check if any registered function is called (matches word boundary + optional whitespace + open paren)
    const hasAny = functionNames.some((name) => {
      const callPattern = new RegExp(`\\b${name}\\s*\\(`)
      return callPattern.test(content)
    })
    if (hasAny) {
      matches.push(file)
    }
  }

  return matches
}

/**
 * Scan directories for files that contain calls to the specified functions.
 * Returns deduplicated absolute file paths.
 *
 * @example
 * ```ts
 * const files = scanForFragments({
 *   directories: ['src/styled', 'src/components'],
 *   functionNames: ['extendPandaConfig', 'tokens'],
 * })
 * ```
 */
export function scanForFragments(options: ScanOptions): string[] {
  const {
    directories,
    functionNames,
    include = ['**/*.{ts,tsx}'],
    exclude = ['**/node_modules/**', '**/*.d.ts'],
  } = options

  const seen = new Set<string>()
  const result: string[] = []

  for (const dir of directories) {
    for (const file of scanDirectory(dir, functionNames, include, exclude)) {
      if (!seen.has(file)) {
        seen.add(file)
        result.push(file)
      }
    }
  }

  return result
}
