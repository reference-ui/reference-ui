/**
 * Station specification for TST-IMP-05.
 * Verifies that relative specifiers whose basenames contain dots resolve to their TypeScript files
 * with no unresolved-import warning, and that the imported names stay user-owned symbols.
 * Proves primary SPEC ID anchor TST-IMP-05.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-IMP-05',
  async verify({ api }) {
    expect(api.getWarnings()).toEqual([])

    const symbol = await api.loadSymbolByName('UsesDottedImports')
    const tokens = await findMember(symbol, 'tokens')
      .getType()
      ?.getReferencedSymbol()
      ?.load()
    const shape = await findMember(symbol, 'shape')
      .getType()
      ?.getReferencedSymbol()
      ?.load()

    expect(tokens?.getName()).toBe('ThemeTokens')
    expect(shape?.getName()).toBe('StyleShape')
  },
}

export default spec
