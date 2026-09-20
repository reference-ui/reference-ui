/**
 * Station specification for TST-INT-04-interface-merging.
 * Verifies same-file interface declaration merging folds into one symbol
 * carrying the union of members, silently (legal TS, no diagnostic owed).
 * Proves primary SPEC ID anchor TST-INT-04.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-INT-04',
  async verify({ api, emitted }) {
    const manifest = await api.loadManifest()
    expect(manifest.symbolsByName.Widget).toHaveLength(1)

    const widget = await api.loadSymbolByName('Widget')
    const names = widget
      .getMembers()
      .map(m => m.getName())
      .sort()
    expect(names).toEqual(['alpha', 'beta'])

    expect(api.getWarnings()).toEqual([])
    expect(emitted.diagnostics ?? []).toEqual([])
  },
}

export default spec
