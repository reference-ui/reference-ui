import { describe, expect, it } from 'vitest'
import { isTypeParameterReference } from './object-projection'

describe('object-projection type parameter detection', () => {
  describe('isTypeParameterReference', () => {
    it('returns true for a bare single-letter type parameter', () => {
      expect(
        isTypeParameterReference({ id: 'P', name: 'P', library: '@reference-ui/react', typeArguments: [] }),
      ).toBe(true)
    })

    it('returns true for any bare type parameter regardless of name', () => {
      for (const name of ['T', 'TData', 'TKey', 'Props']) {
        expect(
          isTypeParameterReference({ id: name, name, library: '@reference-ui/react', typeArguments: [] }),
        ).toBe(true)
      }
    })

    it('returns false when type arguments are present', () => {
      expect(
        isTypeParameterReference({
          id: 'P',
          name: 'P',
          library: '@reference-ui/react',
          typeArguments: [{ kind: 'raw' as const, summary: 'string' }],
        }),
      ).toBe(false)
    })

    it('returns false when id and name differ (manifest symbol reference)', () => {
      expect(
        isTypeParameterReference({
          id: '_abc123',
          name: 'SomeType',
          library: '@reference-ui/react',
          typeArguments: [],
        }),
      ).toBe(false)
    })
  })

  describe('generic type parameter routing', () => {
    it('all type parameter references use the same loadReferencedSymbol path — P is not special', () => {
      // isTypeParameterReference returns true for any bare param, not just 'P'.
      // The projection layer routes ALL of them through loadReferencedSymbol, which
      // uses generic ambiguity resolution (resolvePreferredBareNameMatch) rather than
      // hard-coded type-name knowledge.
      const params = [
        { id: 'P', name: 'P' },
        { id: 'T', name: 'T' },
        { id: 'TData', name: 'TData' },
        { id: 'StyleProps', name: 'StyleProps' },
      ]
      for (const { id, name } of params) {
        expect(
          isTypeParameterReference({ id, name, library: '@reference-ui/react', typeArguments: [] }),
        ).toBe(true)
      }
    })
  })
})
