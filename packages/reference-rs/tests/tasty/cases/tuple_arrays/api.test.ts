import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

describe('tuple_arrays tasty api', () => {
  addCaseRuntimeSmokeTests('tuple_arrays', 'TupleLabeled')
  addCaseEmittedSnapshotTests('tuple_arrays')

  it('surfaces tuple and array edge cases', async () => {
    const api = createCaseApi('tuple_arrays')
    const tupleLabeled = await api.loadSymbolByName('TupleLabeled')
    const tupleOptional = await api.loadSymbolByName('TupleOptional')
    const tupleRest = await api.loadSymbolByName('TupleRest')
    const readonlyTuple = await api.loadSymbolByName('ReadonlyTuple')
    const constAssertion = await api.loadSymbolByName('ConstAssertion')
    const tupleComplex = await api.loadSymbolByName('TupleComplex')

    // Test labeled tuple
    expect(tupleLabeled.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'tuple',
    })

    // Test optional tuple
    expect(tupleOptional.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'tuple',
    })

    // Test rest tuple
    expect(tupleRest.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'tuple',
    })

    // Test readonly tuple
    expect(readonlyTuple.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'type_operator',
    })

    // Test const assertion
    expect(constAssertion.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'tuple',
    })

    // Test complex tuple
    expect(tupleComplex.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'tuple',
    })
  })

  it('surfaces tuple utility types', async () => {
    const api = createCaseApi('tuple_arrays')
    const arrayToTuple = await api.loadSymbolByName('ArrayToTuple')
    const tupleToArray = await api.loadSymbolByName('TupleToArray')
    const tupleHead = await api.loadSymbolByName('TupleHead')
    const tupleTail = await api.loadSymbolByName('TupleTail')

    // Test utility types
    expect(arrayToTuple.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(tupleToArray.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(tupleHead.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'conditional',
    })
    expect(tupleTail.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'conditional',
    })
  })

  it('surfaces tuple examples', async () => {
    const api = createCaseApi('tuple_arrays')
    const labeledExample = await api.loadSymbolByName('LabeledExample')
    const optionalExample = await api.loadSymbolByName('OptionalExample')
    const restExample = await api.loadSymbolByName('RestExample')
    const readonlyExample = await api.loadSymbolByName('ReadonlyExample')
    const constExample = await api.loadSymbolByName('ConstExample')
    const complexExample = await api.loadSymbolByName('ComplexExample')
    const conversionExample = await api.loadSymbolByName('ConversionExample')

    // Test that examples are properly typed
    expect(labeledExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(optionalExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(restExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(readonlyExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(constExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(complexExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(conversionExample.getUnderlyingType()?.getRaw()).toBeDefined()
  })
})
