/**
 * Case specification for TST-IMP-07.
 * Verifies that import-equals aliases lower to the entity they name: an import namespace member, a namespace
 * declared in the same file, an alias declared inside a namespace block, and an exported alias another module
 * imports. No unsupported-syntax warning is emitted for any of them.
 * Proves primary SPEC ID anchor TST-IMP-07.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-IMP-07',
  async verify({ api }) {
    expect(api.getWarnings()).toEqual([])

    const aliases = await api.loadSymbolByName('UsesAliases')
    const span = await findMember(aliases, 'span')
      .getType()
      ?.getReferencedSymbol()
      ?.load()
    const round = await findMember(aliases, 'round')
      .getType()
      ?.getReferencedSymbol()
      ?.load()
    const ring = await findMember(aliases, 'ring')
      .getType()
      ?.getReferencedSymbol()
      ?.load()
    const report = await findMember(aliases, 'report')
      .getType()
      ?.getReferencedSymbol()
      ?.load()

    expect(span?.getName()).toBe('ByteSpan')
    expect(round?.getName()).toBe('Shapes.Circle')
    expect(ring?.getName()).toBe('Shapes.Circle')
    expect(report?.getName()).toBe('Reports.Report')

    const report_ = await api.loadSymbolByName('Reports.Report')
    const mark = await findMember(report_, 'mark')
      .getType()
      ?.getReferencedSymbol()
      ?.load()
    expect(mark?.getName()).toBe('ByteSpan')

    const consumer = await api.loadSymbolByName('UsesRing')
    const imported = await findMember(consumer, 'ring')
      .getType()
      ?.getReferencedSymbol()
      ?.load()
    expect(imported?.getName()).toBe('Shapes.Circle')
  },
}

export default spec
