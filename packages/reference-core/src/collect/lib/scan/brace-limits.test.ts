// Unit tests for the include brace limits. They take brace patterns and pin the counts the
// limits read: alternatives counted as expandBraces recurses, stopping past the cap, and the
// deepest unescaped brace nesting. Escaped braces count for neither.

import { describe, expect, it } from 'vitest'
import { braceDepth, countBraceAlternatives, MAX_BRACE_ALTERNATIVES, MAX_BRACE_DEPTH } from './brace-limits.ts'
import { expandBraces } from './braces.ts'

function nest(levels: number): string {
  return `src/${'{a,'.repeat(levels)}b${'}'.repeat(levels)}.ts`
}

describe('countBraceAlternatives', () => {
  it('counts what expandBraces builds, commaless braces and unmatched braces included', () => {
    for (const pattern of ['src/**/*.{ts,tsx}', 'src/{a,{b,c}}/{x}/{d,e}', 'src/{a,b', 'plain.ts', '{a,b}{c,d,e}']) {
      expect(countBraceAlternatives(pattern, MAX_BRACE_ALTERNATIVES)).toBe(expandBraces(pattern).length)
    }
  })

  it('passes {a,b} written 10 times and stops past the cap at 11', () => {
    expect(countBraceAlternatives('{a,b}'.repeat(10), MAX_BRACE_ALTERNATIVES)).toBe(1024)
    expect(countBraceAlternatives('{a,b}'.repeat(11), MAX_BRACE_ALTERNATIVES)).toBeGreaterThan(MAX_BRACE_ALTERNATIVES)
  })

  it('stops early on a pattern whose full expansion would never fit in memory', () => {
    const started = Date.now()
    expect(countBraceAlternatives('{a,b}'.repeat(24), MAX_BRACE_ALTERNATIVES)).toBeGreaterThan(MAX_BRACE_ALTERNATIVES)
    expect(Date.now() - started).toBeLessThan(1000)
  })

  it('does not count escaped braces', () => {
    expect(countBraceAlternatives('\\{a,b\\}'.repeat(24), MAX_BRACE_ALTERNATIVES)).toBe(1)
  })

  it.each([5_000, 50_000])('reads %i sequential commaless pairs as one glob without recursing per pair', (pairs) => {
    expect(countBraceAlternatives('{x}'.repeat(pairs), MAX_BRACE_ALTERNATIVES)).toBe(1)
    expect(expandBraces('{x}'.repeat(pairs))).toEqual(['{x}'.repeat(pairs)])
  })

  it.each([5_000, 50_000])('stops past the cap on %i sequential choice pairs', (pairs) => {
    const started = Date.now()
    expect(countBraceAlternatives('{a,b}'.repeat(pairs), MAX_BRACE_ALTERNATIVES)).toBeGreaterThan(MAX_BRACE_ALTERNATIVES)
    expect(countBraceAlternatives(`${'{x}'.repeat(pairs)}{a,b}${'{x}'.repeat(pairs)}`, MAX_BRACE_ALTERNATIVES)).toBe(2)
    expect(Date.now() - started).toBeLessThan(1000)
  })

  it('agrees with expandBraces on every short pattern over braces, commas, escapes and a letter', () => {
    const alphabet = ['{', '}', ',', '\\', 'a']
    const walk = (prefix: string, left: number): void => {
      const expanded = expandBraces(prefix).length
      const counted = countBraceAlternatives(prefix, MAX_BRACE_ALTERNATIVES)
      expect(counted === expanded || (expanded > MAX_BRACE_ALTERNATIVES && counted > MAX_BRACE_ALTERNATIVES)).toBe(true)
      if (left === 0) return
      for (const char of alphabet) walk(prefix + char, left - 1)
    }
    walk('', 7)
  })
})

describe('braceDepth', () => {
  it('reads 64 nesting levels as 64 and 65 as 65', () => {
    expect(braceDepth(nest(MAX_BRACE_DEPTH))).toBe(64)
    expect(braceDepth(nest(MAX_BRACE_DEPTH + 1))).toBe(65)
  })

  it('does not count escaped braces', () => {
    expect(braceDepth(`${'\\{'.repeat(70)}a${'\\}'.repeat(70)}`)).toBe(0)
    expect(braceDepth('src/\\{{a,b}\\}')).toBe(1)
  })
})
