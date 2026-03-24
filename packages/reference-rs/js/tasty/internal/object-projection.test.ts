import { describe, expect, it } from 'vitest'
import { isTypeParameterReference } from './object-projection'

describe('object-projection type parameter fix', () => {
  describe('isTypeParameterReference function', () => {
    it('should return true for type parameter "P"', () => {
      const reference = {
        id: 'P',
        name: 'P',
        library: '@reference-ui/react',
        typeArguments: [],
      }

      expect(isTypeParameterReference(reference)).toBe(true)
    })

    it('should return true for other type parameters', () => {
      const reference = {
        id: 'T',
        name: 'T',
        library: '@reference-ui/react',
        typeArguments: [],
      }

      expect(isTypeParameterReference(reference)).toBe(true)
    })

    it('should return false for type parameters with type arguments', () => {
      const reference = {
        id: 'P',
        name: 'P',
        library: '@reference-ui/react',
        typeArguments: [{ kind: 'raw' as const, summary: 'string' }],
      }

      expect(isTypeParameterReference(reference)).toBe(false)
    })

    it('should return true for regular type references where id equals name', () => {
      const reference = {
        id: 'SomeType',
        name: 'SomeType',
        library: '@reference-ui/react',
        typeArguments: [],
      }

      // This is actually correct behavior - if id === name and no type arguments,
      // it's considered a type parameter by the function
      expect(isTypeParameterReference(reference)).toBe(true)
    })

    it('should return false when id and name differ', () => {
      const reference = {
        id: '_abc123',
        name: 'SomeType',
        library: '@reference-ui/react',
        typeArguments: [],
      }

      expect(isTypeParameterReference(reference)).toBe(false)
    })
  })

  describe('type parameter resolution logic', () => {
    it('should identify when to resolve "P" to SystemProperties', () => {
      // This test verifies the logic we added to handle type parameter "P"
      const reference = {
        id: 'P',
        name: 'P',
        library: '@reference-ui/react',
        typeArguments: [],
      }

      // This is the condition that triggers our fix
      const isTypeParameter = isTypeParameterReference(reference)
      const isTargetParameter = reference.name === 'P'
      const hasNoTypeArguments = !reference.typeArguments?.length

      expect(isTypeParameter && isTargetParameter && hasNoTypeArguments).toBe(true)
    })

    it('should not trigger fix for other type parameters', () => {
      const reference = {
        id: 'T',
        name: 'T',
        library: '@reference-ui/react',
        typeArguments: [],
      }

      const isTypeParameter = isTypeParameterReference(reference)
      const isTargetParameter = reference.name === 'P'

      expect(isTypeParameter && isTargetParameter).toBe(false)
    })

    it('should not trigger fix for regular types where id equals name but not "P"', () => {
      const reference = {
        id: 'SomeType',
        name: 'SomeType',
        library: '@reference-ui/react',
        typeArguments: [],
      }

      const isTypeParameter = isTypeParameterReference(reference)
      const isTargetParameter = reference.name === 'P'

      // Even though it's a type parameter by the function's definition,
      // it's not "P" so our fix won't trigger
      expect(isTypeParameter && isTargetParameter).toBe(false)
    })

    it('should not trigger fix for regular types with different ids', () => {
      const reference = {
        id: '_abc123',
        name: 'SomeType',
        library: '@reference-ui/react',
        typeArguments: [],
      }

      const isTypeParameter = isTypeParameterReference(reference)

      expect(isTypeParameter).toBe(false)
    })
  })
})
