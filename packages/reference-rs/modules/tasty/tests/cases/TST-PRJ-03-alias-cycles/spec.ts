/**
 * Station specification for TST-PRJ-03-alias-cycles.
 * Verifies display-member projection terminates on alias-definition cycles.
 * Proves primary SPEC ID anchor TST-PRJ-03.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { TastyCaseResult } from '../../helpers.js'

function memberNames(
  members: Array<{ getName(): string }> | undefined
): string[] | undefined {
  return members?.map(m => m.getName())
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-PRJ-03',
  async verify({ api }) {
    // Alias-definition cycle (Alpha <-> Beta): projection must terminate and
    // contribute each side's local members exactly once (cycle cut, no revisit).
    const alpha = await api.loadSymbolByName('CyclicAlpha')
    const beta = await api.loadSymbolByName('CyclicBeta')

    expect(memberNames(await alpha.getDisplayMembers())?.sort()).toEqual([
      'alphaLocal',
      'betaLocal',
    ])
    expect(memberNames(await beta.getDisplayMembers())?.sort()).toEqual([
      'alphaLocal',
      'betaLocal',
    ])
    expect(alpha.getMembers()).toEqual([])
    expect(beta.getMembers()).toEqual([])
  },
}

export default spec
