import { readFileSync } from 'node:fs'
import fg from 'fast-glob'
import type { ScanOptions } from './types'

const DEFAULT_EXCLUDE = ['**/node_modules/**', '**/*.d.ts']

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toArray(value?: string | string[]): string[] {
  if (!value) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

function createImportPatterns(importFrom?: string | string[]): RegExp[] {
  return toArray(importFrom).map((moduleId) =>
    new RegExp(`\\bfrom\\s*['"]${escapeRegex(moduleId)}['"]|\\bimport\\s*['"]${escapeRegex(moduleId)}['"]`, 'm')
  )
}

function createFunctionPatterns(functionNames?: string[]): RegExp[] {
  return (functionNames ?? []).map((name) => new RegExp(`\\b${name}\\s*\\(`))
}

function readFileOrSkip(file: string): string | null {
  try {
    return readFileSync(file, 'utf-8')
  } catch {
    return null
  }
}

function matchesAnyPattern(content: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(content))
}

/**
 * Find files that either import a target module or call one of the given functions.
 * Import-based discovery is preferred because it aligns with the public system API.
 *
 * @example
 * scanForFragments({
 *   include: ['src/(glob).{ts,tsx}'],
 *   importFrom: '@reference-ui/system',
 * })
 */
export function scanForFragments(options: ScanOptions): string[] {
  const {
    include,
    functionNames,
    importFrom,
    exclude = DEFAULT_EXCLUDE,
    cwd = process.cwd(),
  } = options

  const files = fg.sync(include, {
    cwd,
    absolute: true,
    ignore: exclude,
  })

  const importPatterns = createImportPatterns(importFrom)
  const functionPatterns = createFunctionPatterns(functionNames)
  const discoveryPatterns = importPatterns.length > 0 ? importPatterns : functionPatterns

  if (discoveryPatterns.length === 0) {
    throw new Error('scanForFragments: provide importFrom or functionNames')
  }

  const matches: string[] = []
  for (const file of files) {
    const content = readFileOrSkip(file)
    if (content === null) {
      continue
    }
    if (matchesAnyPattern(content, discoveryPatterns)) {
      matches.push(file)
    }
  }

  return matches
}
