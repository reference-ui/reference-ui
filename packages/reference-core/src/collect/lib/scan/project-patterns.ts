// Pattern helpers for the project listing: how an include or ignore glob is read, tested and cut down.
// They take glob strings and emit the predicates and prefixes the walk in project-files.ts decides with: negation, the
// `./` spelling, a pattern that leaves the root, the static directory a pattern starts from, and the picomatch matchers
// for kept files and dropped paths. Every matcher rewrites a `[!` class to `[^` first, as the Rust walk and fast-glob read it.

import { isAbsolute } from 'node:path'
import picomatch from 'picomatch'
import { negatedClassesAsCaret } from './glob-classes.ts'
import type { KeepFn } from './project-admission.ts'

/** True when a negated alternative may prune the walk: it negates everything beneath a directory (`**` or `<dir>/**`). */
export function prunesDescent(alternative: string): boolean {
  return alternative === '**' || alternative.endsWith('/**')
}

export function isNegated(pattern: string): boolean {
  return pattern.startsWith('!')
}

// fast-glob reads a leading `./` as the root itself, so the matchers see the same relative spelling.
export function normalizePattern(pattern: string): string {
  return pattern.replace(/^\.\//, '')
}

// A pattern that leaves the root (`../shared/**`) or names an absolute base walks that base instead of the root.
export function isOutside(pattern: string): boolean {
  return isAbsolute(pattern) || pattern === '..' || pattern.startsWith('../')
}

// The leading segments with no glob magic: the directory a pattern starts from.
export function staticPrefix(pattern: string): string {
  const segments: string[] = []
  for (const segment of pattern.split('/')) {
    if (/[*?[\]{}()!]/.test(segment)) break
    segments.push(segment)
  }
  return segments.join('/') || '.'
}

// Relative patterns match the root-relative path; absolute patterns match the absolute path, as fast-glob returns them.
export function keepMatcher(include: readonly string[]): KeepFn {
  const relativePatterns = include.filter((pattern) => !isAbsolute(pattern)).map(negatedClassesAsCaret)
  const absolutePatterns = include.filter((pattern) => isAbsolute(pattern)).map(negatedClassesAsCaret)
  const relativeMatch = relativePatterns.length > 0 ? picomatch(relativePatterns, { dot: true }) : () => false
  const absoluteMatch = absolutePatterns.length > 0 ? picomatch(absolutePatterns, { dot: true }) : () => false
  return (rel, alias) => relativeMatch(rel) || absoluteMatch(alias)
}

export function ignoreMatcher(ignore: readonly string[]): (relativePath: string) => boolean {
  if (ignore.length === 0) return () => false
  return picomatch(ignore.map((pattern) => negatedClassesAsCaret(normalizePattern(pattern))), { dot: true })
}
