/**
 * Station specification for TST-GEN-02-advanced-generics.
 * Verifies complex generic type patterns, constraints, recursive mappings, and variadic tuples.
 * Proves primary SPEC ID anchor TST-GEN-02.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import {
  expectUnderlyingKindOneOf,
  expectUnderlyingPresent,
  type TastyCaseResult,
} from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-GEN-02',
  async verify({ api }) {
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
    expectUnderlyingKindOneOf(genericRecursive, ['mapped', 'object'])
    expectUnderlyingKindOneOf(genericDistributive, ['conditional'])
    expectUnderlyingKindOneOf(genericVariadic, ['tuple'])

    const examples = await Promise.all([
      api.loadSymbolByName('UnionWithDefaults'),
      api.loadSymbolByName('ConstrainedWrapper'),
      api.loadSymbolByName('PromiseUnwrapper'),
      api.loadSymbolByName('HigherKindedExample'),
      api.loadSymbolByName('DeepPartialExample'),
      api.loadSymbolByName('NonNullableExample'),
      api.loadSymbolByName('TupleConcatExample'),
    ])

    for (const sym of examples) {
      expectUnderlyingPresent(sym)
    }
  },
}

export default spec
