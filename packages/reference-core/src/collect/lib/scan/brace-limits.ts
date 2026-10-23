// Limits on an include pattern's braces, read before expandBraces builds a single alternative. It takes one pattern
// and emits two numbers: how many globs its braces expand to, counted the way expandBraces recurses but stopped once
// past a cap, and the deepest unescaped brace nesting, read in one pass. Config validation refuses a pattern past
// either limit, so a hostile include fails by name instead of running the expansion out of memory.

import { findBracePair, splitChoices } from './project-globs.ts'

/** The most globs one include pattern's braces may expand to. */
export const MAX_BRACE_ALTERNATIVES = 1024

/** The deepest one include pattern's braces may nest. */
export const MAX_BRACE_DEPTH = 64

/**
 * Count the globs expandBraces would build for `pattern`, with the same pair, choice and
 * commaless-literal rules. Stops as soon as the count passes `cap`, so the result is exact
 * up to `cap` and only "more than cap" beyond it; no alternative list is ever built.
 */
export function countBraceAlternatives(pattern: string, cap: number): number {
  const chars = Array.from(pattern)
  const pair = findBracePair(chars)
  if (pair === undefined) return 1
  const [open, close] = pair
  const choices = splitChoices(chars.slice(open + 1, close))
  if (choices.length < 2) return countBraceAlternatives(chars.slice(close + 1).join(''), cap)
  const before = chars.slice(0, open).join('')
  const after = chars.slice(close + 1).join('')
  let total = 0
  for (const choice of choices) {
    total += countBraceAlternatives(before + choice + after, cap - total)
    if (total > cap) return total
  }
  return total
}

/** The deepest unescaped `{` nesting in `pattern`; a backslash escapes the next character, and a stray `}` never goes below zero. */
export function braceDepth(pattern: string): number {
  const chars = Array.from(pattern)
  let depth = 0
  let deepest = 0
  for (let at = 0; at < chars.length; at += 1) {
    const char = chars[at]
    if (char === '\\') at += 1
    else if (char === '{') deepest = Math.max(deepest, ++depth)
    else if (char === '}') depth = Math.max(0, depth - 1)
  }
  return deepest
}
