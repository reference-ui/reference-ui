/**
 * Station specification for TST-COL-01-same-name-user-collisions.
 * Verifies duplicate user symbol discovery, ambiguity diagnostics, and lookup rejection.
 * Proves primary SPEC ID anchor TST-COL-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-COL-01',
  async verify({ api }) {
    const matches = await api.findSymbolsByName('SharedProps')

    expect(matches).toHaveLength(2)
    expect(matches.map((symbol) => symbol.library)).toEqual(['user', 'user'])
    expect(
      api
        .getWarnings()
        .some((warning) => warning.includes('Duplicate symbol name "SharedProps"'))
    ).toBe(true)

    await expect(api.loadSymbolByName('SharedProps')).rejects.toThrow(
      'Ambiguous symbol name "SharedProps"'
    )
    await expect(api.loadSymbolByScopedName('user', 'SharedProps')).rejects.toThrow(
      'Ambiguous symbol name "SharedProps"'
    )
  },
}

export default spec
