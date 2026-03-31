import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

describe('discriminated_unions tasty api', () => {
  addCaseRuntimeSmokeTests('discriminated_unions', 'Action')
  addCaseEmittedSnapshotTests('discriminated_unions')

  it('surfaces discriminated union patterns', async () => {
    const api = createCaseApi('discriminated_unions')
    const discriminatedUnion = await api.loadSymbolByName('DiscriminatedUnion')
    const action = await api.loadSymbolByName('Action')
    const exhaustiveSwitch = await api.loadSymbolByName('ExhaustiveSwitch')
    const unionOfInterfaces = await api.loadSymbolByName('UnionOfInterfaces')
    const apiResponse = await api.loadSymbolByName('ApiResponse')
    const networkState = await api.loadSymbolByName('NetworkState')

    // Test discriminated union
    expect(discriminatedUnion.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'union'
    })

    // Test action union
    expect(action.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'union'
    })

    // Test exhaustive switch pattern
    expect(exhaustiveSwitch.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'conditional'
    })

    // Test union of interfaces
    expect(unionOfInterfaces.getUnderlyingType()?.getRaw()).toBeDefined()

    // Test API response union
    expect(apiResponse.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'union'
    })

    // Test network state union
    expect(networkState.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'union'
    })
  })

  it('surfaces discriminated union examples', async () => {
    const api = createCaseApi('discriminated_unions')
    const actionHandler = await api.loadSymbolByName('ActionHandler')
    const responseProcessor = await api.loadSymbolByName('ResponseProcessor')
    const networkReducer = await api.loadSymbolByName('NetworkReducer')
    const unionExtractor = await api.loadSymbolByName('UnionExtractor')

    // Test that examples are properly typed
    expect(actionHandler.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(responseProcessor.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(networkReducer.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(unionExtractor.getUnderlyingType()?.getRaw()).toBeDefined()

    // Test that handler methods have correct signatures
    const handleMethod = findMember(actionHandler, 'handle')
    expect(handleMethod.getType()?.getRaw()).toBeDefined()

    const getUserActionsMethod = findMember(actionHandler, 'getUserActions')
    expect(getUserActionsMethod.getType()?.getRaw()).toBeDefined()
  })
})
