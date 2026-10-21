/**
 * Case specification for TST-IMP-08.
 * Verifies that relative specifiers carrying a ?raw query or a #hash suffix are checked against the file they name,
 * so the sibling notes.md raises no unresolved-import warning, and that the importing module still emits its symbol.
 * Proves primary SPEC ID anchor TST-IMP-08.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-IMP-08',
  async verify({ api }) {
    const unresolved = api
      .getWarnings()
      .filter(w => w.code === 'TST-W-UNRESOLVED-IMPORT')
    expect(unresolved).toEqual([])

    const symbol = await api.loadSymbolByName('NotesModule')
    expect(symbol.getName()).toBe('NotesModule')
  },
}

export default spec
