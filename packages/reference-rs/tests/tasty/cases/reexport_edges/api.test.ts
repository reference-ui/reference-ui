import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

describe('reexport_edges tasty api', () => {
  addCaseRuntimeSmokeTests('reexport_edges', 'Foo')
  addCaseEmittedSnapshotTests('reexport_edges')

  it('surfaces re-export edge cases', async () => {
    const api = createCaseApi('reexport_edges')
    const foo = await api.loadSymbolByName('Foo')
    const bar = await api.loadSymbolByName('Bar')
    const baz = await api.loadSymbolByName('Baz')
    const typeA = await api.loadSymbolByName('TypeA')
    const typeB = await api.loadSymbolByName('TypeB')
    const ns = await api.loadSymbolByName('NS')

    // Test basic re-exports
    expect(foo.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(bar.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(baz.getUnderlyingType()?.getRaw()).toBeDefined()

    // Test type re-exports
    expect(typeA.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(typeB.getUnderlyingType()?.getRaw()).toBeDefined()

    // Test namespace re-export
    expect(ns.getUnderlyingType()?.getRaw()).toBeDefined()
  })

  it('surfaces complex re-export patterns', async () => {
    const api = createCaseApi('reexport_edges')
    const reexportTypeOnly = await api.loadSymbolByName('ReexportTypeOnly')
    const reexportStarAs = await api.loadSymbolByName('ReexportStarAs')
    const reexportDefaultAsNamed = await api.loadSymbolByName('ReexportDefaultAsNamed')
    const barrelDeep = await api.loadSymbolByName('BarrelDeep')
    const circularReexport = await api.loadSymbolByName('CircularReexport')

    // Test that re-export patterns are properly resolved
    expect(reexportTypeOnly.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(reexportStarAs.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(reexportDefaultAsNamed.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(barrelDeep.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(circularReexport.getUnderlyingType()?.getRaw()).toBeDefined()
  })
})
