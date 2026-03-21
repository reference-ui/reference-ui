import type { TastyTypeRef } from './api-types'

export function getTastyResolvedType(typeRef: TastyTypeRef | undefined): TastyTypeRef | undefined {
  let current = typeRef

  while (current) {
    const resolved = current.getResolved()
    if (!resolved) return current
    current = resolved
  }

  return undefined
}
