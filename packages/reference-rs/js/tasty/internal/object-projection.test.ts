import { describe, expect, it } from 'vitest'
import { isTypeParameterReference } from './object-projection'

describe('object-projection type parameter detection', () => {
  it('returns true for type parameter "P"', () => {
      const reference = {
        id: 'P',
        name: 'P',
        library: '@reference-ui/react',
        typeArguments: [],
      }

    expect(isTypeParameterReference(reference)).toBe(true)
  })

  it('returns true for other type parameters', () => {
      const reference = {
        id: 'T',
        name: 'T',
        library: '@reference-ui/react',
        typeArguments: [],
      }

    expect(isTypeParameterReference(reference)).toBe(true)
  })

  it('returns false for type parameters with type arguments', () => {
      const reference = {
        id: 'P',
        name: 'P',
        library: '@reference-ui/react',
        typeArguments: [{ kind: 'raw' as const, summary: 'string' }],
      }

    expect(isTypeParameterReference(reference)).toBe(false)
  })

  it('returns true for regular type references where id equals name', () => {
      const reference = {
        id: 'SomeType',
        name: 'SomeType',
        library: '@reference-ui/react',
        typeArguments: [],
      }

    expect(isTypeParameterReference(reference)).toBe(true)
  })

  it('returns false when id and name differ', () => {
      const reference = {
        id: '_abc123',
        name: 'SomeType',
        library: '@reference-ui/react',
        typeArguments: [],
      }
    expect(isTypeParameterReference(reference)).toBe(false)
  })
})
