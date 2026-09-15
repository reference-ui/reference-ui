/**
 * Station specification for TST-PAT-01-real-world-patterns.
 * Verifies real-world ecosystem type structures including React, Zod, and styled system patterns.
 * Proves primary SPEC ID anchor TST-PAT-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import {
  expectUnderlyingKindOneOf,
  expectUnderlyingPresent,
  findMember,
  type TastyApi,
  type TastyCaseResult,
} from '../../helpers.js'

async function verifyPatternShapes(api: TastyApi): Promise<void> {
  const reactComponentProps = await api.loadSymbolByName('ReactComponentProps')
  const reactForwardRef = await api.loadSymbolByName('ReactForwardRef')
  const reactContext = await api.loadSymbolByName('ReactContext')
  const eventHandlerMap = await api.loadSymbolByName('EventHandlerMap')
  const builderPatternGeneric = await api.loadSymbolByName('BuilderPatternGeneric')
  const zodInfer = await api.loadSymbolByName('ZodInfer')
  const styledSystemProps = await api.loadSymbolByName('StyledSystemProps')

  for (const sym of [reactComponentProps, reactForwardRef, reactContext, builderPatternGeneric]) {
    expectUnderlyingPresent(sym)
  }

  expectUnderlyingKindOneOf(eventHandlerMap, ['mapped', 'object'])
  expectUnderlyingKindOneOf(zodInfer, ['conditional'])
  expectUnderlyingKindOneOf(styledSystemProps, ['intersection'])
}

async function verifyPatternExamples(api: TastyApi): Promise<void> {
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

  expect(findMember(componentExample, 'getPropType').getType()?.getRaw()).toBeDefined()
  expect(findMember(builderExample, 'buildUser').getType()?.getRaw()).toBeDefined()
  expect(findMember(zodExample, 'parseData').getType()?.getRaw()).toBeDefined()
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-PAT-01',
  async verify({ api }) {
    await verifyPatternShapes(api)
    await verifyPatternExamples(api)
  },
}

export default spec
