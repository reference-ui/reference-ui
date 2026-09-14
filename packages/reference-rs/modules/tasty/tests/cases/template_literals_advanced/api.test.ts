import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  expectUnderlyingKindOneOf,
  expectUnderlyingPresent,
} from '../../api-test-helpers'

describe('template_literals_advanced tasty api', () => {
  addCaseRuntimeSmokeTests('template_literals_advanced', 'TemplateLiteralMapped')
  addCaseEmittedSnapshotTests('template_literals_advanced')

  it('exposes advanced template literal patterns as loadable type data', async () => {
    const api = createCaseApi('template_literals_advanced')
    const templateLiteralMapped = await api.loadSymbolByName('TemplateLiteralMapped')
    const templateLiteralUnionExplosion = await api.loadSymbolByName(
      'TemplateLiteralUnionExplosion'
    )
    const templateLiteralIntrinsic = await api.loadSymbolByName(
      'TemplateLiteralIntrinsic'
    )
    const getterMapped = await api.loadSymbolByName('GetterMapped')
    const routePaths = await api.loadSymbolByName('RoutePaths')
    const cssClasses = await api.loadSymbolByName('CssClasses')
    const eventNames = await api.loadSymbolByName('EventNames')
    const apiEndpoints = await api.loadSymbolByName('ApiEndpoints')

    expectUnderlyingKindOneOf(templateLiteralMapped, ['mapped'])
    // Union expansion may stay a template literal node until evaluated or collapse to a union.
    expectUnderlyingKindOneOf(templateLiteralUnionExplosion, ['union', 'template_literal'])
    expectUnderlyingKindOneOf(templateLiteralIntrinsic, ['object'])

    for (const sym of [getterMapped, routePaths, cssClasses, eventNames, apiEndpoints]) {
      expectUnderlyingPresent(sym)
    }
  })

  it('exposes template literal examples as loadable type data', async () => {
    const api = createCaseApi('template_literals_advanced')
    const getterExample = await api.loadSymbolByName('GetterExample')
    const routeExample = await api.loadSymbolByName('RouteExample')
    const cssExample = await api.loadSymbolByName('CssExample')
    const eventExample = await api.loadSymbolByName('EventExample')
    const apiExample = await api.loadSymbolByName('ApiExample')
    const intrinsicExample = await api.loadSymbolByName('IntrinsicExample')

    for (const sym of [
      getterExample,
      routeExample,
      cssExample,
      eventExample,
      apiExample,
      intrinsicExample,
    ]) {
      expectUnderlyingPresent(sym)
    }

    // Interface-backed example: members available for display
    const members = intrinsicExample.getMembers()
    expect(members.length).toBeGreaterThan(0)
  })
})
