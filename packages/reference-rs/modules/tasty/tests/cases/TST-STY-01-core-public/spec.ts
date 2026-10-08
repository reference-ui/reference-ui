/**
 * Station specification for TST-STY-01-core-public.
 * Verifies merging Omit projections with public style interfaces.
 * Proves primary SPEC ID anchor TST-STY-01.
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
  id: 'TST-STY-01',
  async verify({ api }) {
    const styleProps = await api.loadSymbolByName('StylePropsCore')
    const names = memberNames(await styleProps.getDisplayMembers())?.sort()

    expect(names).toEqual(['color', 'container', 'display', 'font', 'r', 'weight'])
    expect(styleProps.getMembers()).toEqual([])
  },
}

export default spec
