import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  expectUnderlyingKindOneOf,
  expectUnderlyingPresent,
  findMember,
} from '../../api-test-helpers'

describe('real_world_patterns tasty api', () => {
  addCaseRuntimeSmokeTests('real_world_patterns', 'ReactComponentProps')
  addCaseEmittedSnapshotTests('real_world_patterns')

  it('exposes real-world patterns as loadable type data', async () => {
    const api = createCaseApi('real_world_patterns')
    const reactComponentProps = await api.loadSymbolByName('ReactComponentProps')
    const reactForwardRef = await api.loadSymbolByName('ReactForwardRef')
    const reactContext = await api.loadSymbolByName('ReactContext')
    const eventHandlerMap = await api.loadSymbolByName('EventHandlerMap')
    const builderPatternGeneric = await api.loadSymbolByName('BuilderPatternGeneric')
    const zodInfer = await api.loadSymbolByName('ZodInfer')
    const styledSystemProps = await api.loadSymbolByName('StyledSystemProps')

    for (const sym of [
      reactComponentProps,
      reactForwardRef,
      reactContext,
      builderPatternGeneric,
    ]) {
      expectUnderlyingPresent(sym)
    }

    expectUnderlyingKindOneOf(eventHandlerMap, ['mapped', 'object'])
    expectUnderlyingKindOneOf(zodInfer, ['conditional'])
    expectUnderlyingKindOneOf(styledSystemProps, ['intersection'])
  })

  it('exposes real-world examples as loadable type data', async () => {
    const api = createCaseApi('real_world_patterns')
    const componentExample = await api.loadSymbolByName('ComponentExample')
    const forwardRefExample = await api.loadSymbolByName('ForwardRefExample')
    const contextExample = await api.loadSymbolByName('ContextExample')
    const eventHandlerExample = await api.loadSymbolByName('EventHandlerExample')
    const builderExample = await api.loadSymbolByName('BuilderExample')
    const zodExample = await api.loadSymbolByName('ZodExample')
    const styledSystemExample = await api.loadSymbolByName('StyledSystemExample')

    for (const sym of [
      componentExample,
      forwardRefExample,
      contextExample,
      eventHandlerExample,
      builderExample,
      zodExample,
      styledSystemExample,
    ]) {
      expectUnderlyingPresent(sym)
    }

    // Specific members still resolvable
    const getPropType = findMember(componentExample, 'getPropType')
    expect(getPropType.getType()?.getRaw()).toBeDefined()

    const buildUser = findMember(builderExample, 'buildUser')
    expect(buildUser.getType()?.getRaw()).toBeDefined()

    const parseData = findMember(zodExample, 'parseData')
    expect(parseData.getType()?.getRaw()).toBeDefined()
  })
})
