import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  expectUnderlyingPresent,
} from '../../api-test-helpers'

describe('reexport_edges tasty api', () => {
  addCaseRuntimeSmokeTests('reexport_edges', 'Foo')
  addCaseEmittedSnapshotTests('reexport_edges')

  it('can load symbols across re-export edge cases', async () => {
    const api = createCaseApi('reexport_edges')
    // Manifest entries use declaration names (and may omit value-only / namespace re-export aliases).
    const foo = await api.loadSymbolByName('Foo')
    const reexportTypeOnly = await api.loadSymbolByName('ReexportTypeOnly')
    const reexportMixed = await api.loadSymbolByName('ReexportMixed')
    const ambientModule = await api.loadSymbolByName('AmbientModule')

    for (const sym of [foo, reexportTypeOnly, reexportMixed, ambientModule]) {
      expectUnderlyingPresent(sym)
    }
  })

  it('can load symbols for complex re-export patterns', async () => {
    const api = createCaseApi('reexport_edges')
    const reexportMixedType = await api.loadSymbolByName('ReexportMixedType')
    const barrelDeepItem = await api.loadSymbolByName('BarrelDeepItem')
    const circularItem = await api.loadSymbolByName('CircularItem')
    const starSourceItem = await api.loadSymbolByName('StarSourceItem')

    for (const sym of [reexportMixedType, barrelDeepItem, circularItem, starSourceItem]) {
      expectUnderlyingPresent(sym)
    }
  })
})
