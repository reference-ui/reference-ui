/**
 * Follows the resolved chain of a TastyTypeRef to its settled type.
 * Takes a possibly wrapped reference and returns the deepest type with no further resolution, or undefined when the chain ends empty.
 */
import type { TastyTypeRef } from './api-types.js'

export function getTastyResolvedType(
  typeRef: TastyTypeRef | undefined
): TastyTypeRef | undefined {
  let current = typeRef

  while (current) {
    const resolved = current.getResolved()
    if (!resolved) return current
    current = resolved
  }

  return undefined
}
