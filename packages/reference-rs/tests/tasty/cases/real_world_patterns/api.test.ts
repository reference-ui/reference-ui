import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

describe('real_world_patterns tasty api', () => {
  addCaseRuntimeSmokeTests('real_world_patterns', 'ReactComponentProps')
  addCaseEmittedSnapshotTests('real_world_patterns')

  it('surfaces real-world patterns', async () => {
    const api = createCaseApi('real_world_patterns')
    const reactComponentProps = await api.loadSymbolByName('ReactComponentProps')
    const reactForwardRef = await api.loadSymbolByName('ReactForwardRef')
    const reactContext = await api.loadSymbolByName('ReactContext')
    const eventHandlerMap = await api.loadSymbolByName('EventHandlerMap')
    const builderPatternGeneric = await api.loadSymbolByName('BuilderPatternGeneric')
    const zodInfer = await api.loadSymbolByName('ZodInfer')
    const styledSystemProps = await api.loadSymbolByName('StyledSystemProps')

    // Test React patterns
    expect(reactComponentProps.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(reactForwardRef.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(reactContext.getUnderlyingType()?.getRaw()).toBeDefined()

    // Test event handler map
    expect(eventHandlerMap.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'object'
    })

    // Test builder pattern
    expect(builderPatternGeneric.getUnderlyingType()?.getRaw()).toBeDefined()

    // Test Zod infer pattern
    expect(zodInfer.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'conditional'
    })

    // Test styled system props
    expect(styledSystemProps.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'intersection'
    })
  })

  it('surfaces real-world examples', async () => {
    const api = createCaseApi('real_world_patterns')
    const componentExample = await api.loadSymbolByName('ComponentExample')
    const forwardRefExample = await api.loadSymbolByName('ForwardRefExample')
    const contextExample = await api.loadSymbolByName('ContextExample')
    const eventHandlerExample = await api.loadSymbolByName('EventHandlerExample')
    const builderExample = await api.loadSymbolByName('BuilderExample')
    const zodExample = await api.loadSymbolByName('ZodExample')
    const styledSystemExample = await api.loadSymbolByName('StyledSystemExample')

    // Test that examples are properly typed
    expect(componentExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(forwardRefExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(contextExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(eventHandlerExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(builderExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(zodExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(styledSystemExample.getUnderlyingType()?.getRaw()).toBeDefined()

    // Test specific example methods
    const getPropType = findMember(componentExample, 'getPropType')
    expect(getPropType.getType()?.getRaw()).toBeDefined()

    const buildUser = findMember(builderExample, 'buildUser')
    expect(buildUser.getType()?.getRaw()).toBeDefined()

    const parseData = findMember(zodExample, 'parseData')
    expect(parseData.getType()?.getRaw()).toBeDefined()
  })
})
