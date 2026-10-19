/**
 * Error constructors for the Tasty runtime.
 * Builds the Error values the runtime raises: a message with its cause attached, and an
 * ambiguous bare-name lookup that lists each candidate by id and library. Leaf module with
 * no runtime imports.
 */
import type { TastySymbolSearchResult } from '../api-types.js'

export function wrapRuntimeError(prefix: string, error: unknown): Error {
  const suffix = error instanceof Error ? error.message : String(error)
  return new Error(`${prefix} ${suffix}`)
}

export function createAmbiguousSymbolNameError(
  name: string,
  matches: TastySymbolSearchResult[]
): Error {
  return new Error(
    `Ambiguous symbol name "${name}". Matches: ${matches.map(formatSymbolCandidate).join(', ')}`
  )
}

export function formatSymbolCandidate(result: TastySymbolSearchResult): string {
  return `${result.id} (${result.library})`
}
