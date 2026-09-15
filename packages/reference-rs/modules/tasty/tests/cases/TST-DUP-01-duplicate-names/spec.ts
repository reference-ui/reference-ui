/**
 * Station specification for TST-DUP-01-duplicate-names.
 * Verifies preservation of duplicate symbol names in manifest and lookup rejection.
 * Proves primary SPEC ID anchor TST-DUP-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-DUP-01',
  async verify({ api }) {
    const manifest = await api.loadManifest()
    const matches = await api.findSymbolsByName('Shared')

    expect(manifest.symbolsByName.Shared).toHaveLength(2)
    expect(matches).toHaveLength(2)
    expect(
      api
        .getWarnings()
        .some(warning => warning.includes('Duplicate symbol name "Shared"'))
    ).toBe(true)

    await expect(api.loadSymbolByName('Shared')).rejects.toThrow(
      'Ambiguous symbol name "Shared"'
    )
  },
}

export default spec
