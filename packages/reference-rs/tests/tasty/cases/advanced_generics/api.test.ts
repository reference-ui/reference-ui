import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

describe('advanced_generics tasty api', () => {
  addCaseRuntimeSmokeTests('advanced_generics', 'GenericDefaultsComplex')
  addCaseEmittedSnapshotTests('advanced_generics')

  it('surfaces advanced generic patterns', async () => {
    const api = createCaseApi('advanced_generics')
    const genericDefaults = await api.loadSymbolByName('GenericDefaultsComplex')
    const genericConstraints = await api.loadSymbolByName('GenericConstraintsExtends')
    const genericInfer = await api.loadSymbolByName('GenericInfer')
    const genericHigherKinded = await api.loadSymbolByName('GenericHigherKinded')
    const genericRecursive = await api.loadSymbolByName('GenericRecursive')
    const genericDistributive = await api.loadSymbolByName('GenericDistributiveConditional')
    const genericVariadic = await api.loadSymbolByName('GenericVariadicTuples')

    // Test generic defaults
    expect(genericDefaults.getTypeParameters()).toHaveLength(2)
    expect(genericDefaults.getTypeParameters()[0]?.name).toBe('T')
    expect(genericDefaults.getTypeParameters()[1]?.name).toBe('K')

    // Test generic constraints
    expect(genericConstraints.getTypeParameters()).toHaveLength(1)
    expect(genericConstraints.getTypeParameters()[0]?.constraint).toMatchObject({
      kind: 'object',
      members: expect.arrayContaining([
        expect.objectContaining({ name: 'id' })
      ])
    })

    // Test generic inference
    const inferUnderlying = genericInfer.getUnderlyingType()?.getRaw()
    expect(inferUnderlying).toMatchObject({
      kind: 'conditional'
    })

    // Test higher-kinded types
    expect(genericHigherKinded.getTypeParameters()).toHaveLength(2)

    // Test recursive types
    expect(genericRecursive.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'object'
    })

    // Test distributive conditionals
    expect(genericDistributive.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'conditional'
    })

    // Test variadic tuples
    expect(genericVariadic.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'tuple'
    })
  })

  it('surfaces concrete examples', async () => {
    const api = createCaseApi('advanced_generics')
    const unionWithDefaults = await api.loadSymbolByName('UnionWithDefaults')
    const constrainedWrapper = await api.loadSymbolByName('ConstrainedWrapper')
    const promiseUnwrapper = await api.loadSymbolByName('PromiseUnwrapper')
    const higherKindedExample = await api.loadSymbolByName('HigherKindedExample')
    const deepPartialExample = await api.loadSymbolByName('DeepPartialExample')
    const nonNullableExample = await api.loadSymbolByName('NonNullableExample')
    const tupleConcatExample = await api.loadSymbolByName('TupleConcatExample')

    // Test that examples are properly typed
    expect(unionWithDefaults.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(constrainedWrapper.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(promiseUnwrapper.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(higherKindedExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(deepPartialExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(nonNullableExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(tupleConcatExample.getUnderlyingType()?.getRaw()).toBeDefined()
  })
})
