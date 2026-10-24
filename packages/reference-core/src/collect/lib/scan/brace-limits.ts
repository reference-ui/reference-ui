// Limits on an include pattern's braces, read before expandBraces builds a single alternative. It takes one pattern
// and emits two numbers: how many globs its braces expand to, counted the way expandBraces recurses but stopped once
// past a cap, and the deepest unescaped brace nesting, read in one pass. Config validation refuses a pattern past
// either limit, so a hostile include fails by name instead of running the expansion out of memory.

import { findChoicePair } from './braces.ts'

/** The most globs one include pattern's braces may expand to. */
export const MAX_BRACE_ALTERNATIVES = 1024

/** The deepest one include pattern's braces may nest. */
export const MAX_BRACE_DEPTH = 64

/**
 * Count the globs expandBraces would build for `pattern`, with the same pair, choice and
 * commaless-literal rules. Stops as soon as the count passes `cap`, so the result is exact
 * up to `cap` and only "more than cap" beyond it; no alternative list is ever built.
 * Commaless pairs are skipped by offset and a run of choice pairs is bounded by its floor
 * before any recursion, so a pattern of thousands of pairs never recurses once per pair.
 */
export function countBraceAlternatives(pattern: string, cap: number): number {
  const chars = Array.from(pattern)
  const found = findChoicePair(chars)
  if (found === undefined) return 1
  const floor = choiceFloor(chars, cap)
  if (floor > cap) return floor
  const before = chars.slice(found.from, found.open).join('')
  const after = chars.slice(found.close + 1).join('')
  let total = 0
  for (const choice of found.choices) {
    total += countBraceAlternatives(before + choice + after, cap - total)
    if (total > cap) return total
  }
  return total
}

// A lower bound on the alternatives: every choice pair in a row at least doubles them (two or more choices, each at least one
// glob). Stops doubling once past `cap`, so a long run of pairs costs one pass instead of one recursion level per pair.
function choiceFloor(chars: readonly string[], cap: number): number {
  let floor = 1
  let at = 0
  while (floor <= cap) {
    const found = findChoicePair(chars, at)
    if (found === undefined) break
    floor *= 2
    at = found.close + 1
  }
  return floor
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
