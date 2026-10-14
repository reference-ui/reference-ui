/**
 * Station specification for TST-IMP-06.
 * Verifies that relative .js, .mjs and .cjs specifiers resolve to their TypeScript source siblings
 * (.tsx, .ts, .mts and .cts) with no unresolved-import warning, and that the imported names stay
 * user-owned symbols.
 * Proves primary SPEC ID anchor TST-IMP-06.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-IMP-06',
  async verify({ api }) {
    expect(api.getWarnings()).toEqual([])

    const symbol = await api.loadSymbolByName('UsesRuntimeSpecifiers')
    const button = await findMember(symbol, 'button')
      .getType()
      ?.getReferencedSymbol()
      ?.load()
    const icon = await findMember(symbol, 'icon')
      .getType()
      ?.getReferencedSymbol()
      ?.load()
    const chunk = await findMember(symbol, 'chunk')
      .getType()
      ?.getReferencedSymbol()
      ?.load()
    const legacy = await findMember(symbol, 'legacy')
      .getType()
      ?.getReferencedSymbol()
      ?.load()

    expect(button?.getName()).toBe('ButtonProps')
    expect(icon?.getName()).toBe('IconProps')
    expect(chunk?.getName()).toBe('ChunkShape')
    expect(legacy?.getName()).toBe('LegacyShape')
  },
}

export default spec
