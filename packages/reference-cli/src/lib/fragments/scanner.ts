import { readFileSync } from 'node:fs'
import fg from 'fast-glob'
import type { ScanOptions } from './types'

const DEFAULT_EXCLUDE = ['**/node_modules/**', '**/*.d.ts']

/**
 * Find files that call any of the given function names.
 * Uses regex word-boundary matching to avoid false positives from
 * comments, strings, type declarations, or longer identifiers.
 *
 * @example
 * scanForFragments({
 *   include: ['src/** /*.{ts,tsx}'],
 *   functionNames: ['tokens', 'recipe'],
 * })
 */
export function scanForFragments(options: ScanOptions): string[] {
  const {
    include,
    functionNames,
    exclude = DEFAULT_EXCLUDE,
    cwd = process.cwd(),
  } = options

  const files = fg.sync(include, {
    cwd,
    absolute: true,
    ignore: exclude,
  })

  // Pre-compile one regex per function name: word boundary + optional whitespace + open paren
  const patterns = functionNames.map(name => ({
    name,
    re: new RegExp(`\\b${name}\\s*\\(`),
  }))

  const matches: string[] = []
  for (const file of files) {
    let content: string
    try {
      content = readFileSync(file, 'utf-8')
    } catch {
      continue
    }
    if (patterns.some(({ re }) => re.test(content))) {
      matches.push(file)
    }
  }

  return matches
}
