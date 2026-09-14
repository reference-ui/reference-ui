import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  expectUnderlyingKindOneOf,
  expectUnderlyingPresent,
} from '../../api-test-helpers'

describe('advanced_generics tasty api', () => {
  addCaseRuntimeSmokeTests('advanced_generics', 'GenericDefaultsComplex')
  addCaseEmittedSnapshotTests('advanced_generics')

  it('exposes advanced generic patterns as loadable type data', async () => {
    const api = createCaseApi('advanced_generics')
    const genericDefaults = await api.loadSymbolByName('GenericDefaultsComplex')
    const genericConstraints = await api.loadSymbolByName('GenericConstraintsExtends')
    const genericInfer = await api.loadSymbolByName('GenericInfer')
    const genericHigherKinded = await api.loadSymbolByName('GenericHigherKinded')
    const genericRecursive = await api.loadSymbolByName('GenericRecursive')
    const genericDistributive = await api.loadSymbolByName('GenericDistributiveConditional')
    const genericVariadic = await api.loadSymbolByName('GenericVariadicTuples')

    expect(genericDefaults.getTypeParameters()).toHaveLength(2)
    expect(genericDefaults.getTypeParameters()[0]?.name).toBe('T')
    expect(genericDefaults.getTypeParameters()[1]?.name).toBe('K')

    expect(genericConstraints.getTypeParameters()).toHaveLength(1)
    expect(genericConstraints.getTypeParameters()[0]?.constraint).toMatchObject({
      kind: 'object',
      members: expect.arrayContaining([expect.objectContaining({ name: 'id' })]),
    })

    expectUnderlyingKindOneOf(genericInfer, ['conditional'])
    expect(genericHigherKinded.getTypeParameters()).toHaveLength(2)

    // Recursive mapped types may surface as `mapped` or a normalized `object` depending on IR.
    expectUnderlyingKindOneOf(genericRecursive, ['mapped', 'object'])

    expectUnderlyingKindOneOf(genericDistributive, ['conditional'])
    expectUnderlyingKindOneOf(genericVariadic, ['tuple'])
  })

  it('exposes concrete examples as loadable type data', async () => {
    const api = createCaseApi('advanced_generics')
    const unionWithDefaults = await api.loadSymbolByName('UnionWithDefaults')
    const constrainedWrapper = await api.loadSymbolByName('ConstrainedWrapper')
    const promiseUnwrapper = await api.loadSymbolByName('PromiseUnwrapper')
    const higherKindedExample = await api.loadSymbolByName('HigherKindedExample')
    const deepPartialExample = await api.loadSymbolByName('DeepPartialExample')
    const nonNullableExample = await api.loadSymbolByName('NonNullableExample')
    const tupleConcatExample = await api.loadSymbolByName('TupleConcatExample')

    for (const sym of [
      unionWithDefaults,
      constrainedWrapper,
      promiseUnwrapper,
      higherKindedExample,
      deepPartialExample,
      nonNullableExample,
      tupleConcatExample,
    ]) {
      expectUnderlyingPresent(sym)
    }
  })
})
