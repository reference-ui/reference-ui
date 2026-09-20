/**
 * Station specification for TST-RXP-02-reexport-edges.
 * Verifies complex re-export edge cases, barrels, and circular references.
 * Proves primary SPEC ID anchor TST-RXP-02.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import {
  expectUnderlyingPresent,
  findMember,
  type TastyCaseResult,
} from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-RXP-02',
  async verify({ api, emitted }) {
    const foo = await api.loadSymbolByName('Foo')
    const reexportTypeOnly = await api.loadSymbolByName('ReexportTypeOnly')
    const reexportMixed = await api.loadSymbolByName('ReexportMixed')
    const ambientModule = await api.loadSymbolByName('AmbientModule')

    for (const sym of [foo, reexportTypeOnly, reexportMixed, ambientModule]) {
      expectUnderlyingPresent(sym)
    }

    const reexportMixedType = await api.loadSymbolByName('ReexportMixedType')
    const barrelDeepItem = await api.loadSymbolByName('BarrelDeepItem')
    const circularItem = await api.loadSymbolByName('CircularItem')
    const starSourceItem = await api.loadSymbolByName('StarSourceItem')

    for (const sym of [reexportMixedType, barrelDeepItem, circularItem, starSourceItem]) {
      expectUnderlyingPresent(sym)
    }

    // Wave 6 find q: `StarWidget` is provided by two `export *` targets of
    // the ambiguity barrel, so the barrel exports nothing (tsc TS2308) and
    // the consumer member stays an unresolved external descriptor.
    const use = await api.loadSymbolByName('StarAmbiguityUse')
    const wRaw = findMember(use, 'w').getType()?.getRaw() as {
      id?: string
      name?: string
    }
    expect(wRaw.id).toBe('StarWidget')
    expect(wRaw.name).toBe('StarWidget')

    // Exactly one diagnostic, naming the barrel, the name, and both sources.
    const diagnostics = emitted.diagnostics ?? []
    expect(diagnostics).toHaveLength(1)
    const [ambiguity] = diagnostics
    expect(ambiguity!.file_id).toContain('star-ambiguity-barrel.ts')
    expect(ambiguity!.message).toContain('"StarWidget"')
    expect(ambiguity!.message).toContain('star-ambiguity-a.ts')
    expect(ambiguity!.message).toContain('star-ambiguity-b.ts')

    // The diagnostic also rides the manifest warnings channel.
    const warnings = api.getWarnings()
    expect(
      warnings.some(
        w => w.includes('export * ambiguity') && w.includes('"StarWidget"')
      )
    ).toBe(true)
  },
}

export default spec
