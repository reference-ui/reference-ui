import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  expectUnderlyingKindOneOf,
  expectUnderlyingPresent,
} from '../../api-test-helpers'

describe('tuple_arrays tasty api', () => {
  addCaseRuntimeSmokeTests('tuple_arrays', 'TupleLabeled')
  addCaseEmittedSnapshotTests('tuple_arrays')

  it('exposes tuple and array edge cases as loadable type data', async () => {
    const api = createCaseApi('tuple_arrays')
    const tupleLabeled = await api.loadSymbolByName('TupleLabeled')
    const tupleOptional = await api.loadSymbolByName('TupleOptional')
    const tupleRest = await api.loadSymbolByName('TupleRest')
    const readonlyTuple = await api.loadSymbolByName('ReadonlyTuple')
    const constAssertion = await api.loadSymbolByName('ConstAssertion')
    const tupleComplex = await api.loadSymbolByName('TupleComplex')

    for (const sym of [tupleLabeled, tupleOptional, tupleRest, tupleComplex]) {
      expectUnderlyingKindOneOf(sym, ['tuple'])
    }

    // Readonly / const-tuple lowering may surface as tuple or a readonly wrapper.
    expectUnderlyingKindOneOf(readonlyTuple, ['tuple', 'type_operator'])
    expectUnderlyingKindOneOf(constAssertion, ['tuple', 'type_operator'])
  })

  it('exposes tuple utility types as loadable type data', async () => {
    const api = createCaseApi('tuple_arrays')
    const arrayToTuple = await api.loadSymbolByName('ArrayToTuple')
    const tupleToArray = await api.loadSymbolByName('TupleToArray')
    const tupleHead = await api.loadSymbolByName('TupleHead')
    const tupleTail = await api.loadSymbolByName('TupleTail')

    expectUnderlyingPresent(arrayToTuple)
    expectUnderlyingPresent(tupleToArray)
    expectUnderlyingKindOneOf(tupleHead, ['conditional'])
    expectUnderlyingKindOneOf(tupleTail, ['conditional'])
  })

  it('exposes tuple examples as loadable type data', async () => {
    const api = createCaseApi('tuple_arrays')
    const labeledExample = await api.loadSymbolByName('LabeledExample')
    const optionalExample = await api.loadSymbolByName('OptionalExample')
    const restExample = await api.loadSymbolByName('RestExample')
    const readonlyExample = await api.loadSymbolByName('ReadonlyExample')
    const constExample = await api.loadSymbolByName('ConstExample')
    const complexExample = await api.loadSymbolByName('ComplexExample')
    const conversionExample = await api.loadSymbolByName('ConversionExample')

    for (const sym of [
      labeledExample,
      optionalExample,
      restExample,
      readonlyExample,
      constExample,
      complexExample,
      conversionExample,
    ]) {
      expectUnderlyingPresent(sym)
    }
  })
})
