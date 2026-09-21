// Fragment file discovery over glob roots plus import or call signals.
// It takes scan options and emits absolute paths of matching source files.
// This module is a Neo-owned copy of the core fragment scanner.

import { readFileSync } from 'node:fs'
import fg from 'fast-glob'
import type { ScanOptions } from './types.ts'

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

interface DiscoveryPattern {
  pattern: RegExp
  /** Literal bytes every match contains; the includes pre-gate. */
  needle: string
}

function createImportPatterns(importFrom?: string | string[]): DiscoveryPattern[] {
  return toArray(importFrom).map((moduleId) => ({
    pattern: new RegExp(
      `\\bfrom\\s*['"]${escapeRegex(moduleId)}['"]|\\bimport\\s*['"]${escapeRegex(moduleId)}['"]`,
      'm',
    ),
    needle: moduleId,
  }))
}

function createFunctionPatterns(functionNames?: string[]): DiscoveryPattern[] {
  return (functionNames ?? []).map((name) => ({
    pattern: new RegExp(`\\b${name}\\s*\\(`),
    needle: name,
  }))
}

function readFileOrSkip(file: string): string | null {
  try {
    return readFileSync(file, 'utf-8')
  } catch {
    return null
  }
}

function matchesAnyPattern(content: string, patterns: DiscoveryPattern[]): boolean {
  // A regex match implies the needle bytes, so needle-absent files skip
  // the regex with identical selection.
  return patterns.some(({ pattern, needle }) => content.includes(needle) && pattern.test(content))
}

/**
 * Find files that either import a target module or call one of the given functions.
 * Import-based discovery is preferred because it aligns with the public system API.
 *
 * @example
 * scanForFragments({
 *   include: ['src/(glob).{ts,tsx}'],
 *   importFrom: '@reference-ui/neo',
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
