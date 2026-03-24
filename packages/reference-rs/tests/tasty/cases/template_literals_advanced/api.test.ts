import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

describe('template_literals_advanced tasty api', () => {
  addCaseRuntimeSmokeTests('template_literals_advanced', 'TemplateLiteralMapped')
  addCaseEmittedSnapshotTests('template_literals_advanced')

  it('surfaces advanced template literal patterns', async () => {
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

    // Test template literal mapped type
    expect(templateLiteralMapped.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'mapped',
    })

    // Test template literal union explosion
    expect(templateLiteralUnionExplosion.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'union',
    })

    // Test template literal intrinsics
    expect(templateLiteralIntrinsic.getUnderlyingType()?.getRaw()).toMatchObject({
      kind: 'object',
    })

    // Test concrete mapped types
    expect(getterMapped.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(routePaths.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(cssClasses.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(eventNames.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(apiEndpoints.getUnderlyingType()?.getRaw()).toBeDefined()
  })

  it('surfaces template literal examples', async () => {
    const api = createCaseApi('template_literals_advanced')
    const getterExample = await api.loadSymbolByName('GetterExample')
    const routeExample = await api.loadSymbolByName('RouteExample')
    const cssExample = await api.loadSymbolByName('CssExample')
    const eventExample = await api.loadSymbolByName('EventExample')
    const apiExample = await api.loadSymbolByName('ApiExample')
    const intrinsicExample = await api.loadSymbolByName('IntrinsicExample')

    // Test that examples are properly typed
    expect(getterExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(routeExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(cssExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(eventExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(apiExample.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(intrinsicExample.getUnderlyingType()?.getRaw()).toBeDefined()

    // Test that intrinsic example has some members
    const members = intrinsicExample.getMembers()
    expect(members.length).toBeGreaterThan(0)
  })
})
