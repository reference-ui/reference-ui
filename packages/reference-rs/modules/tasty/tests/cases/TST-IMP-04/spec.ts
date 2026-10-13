/**
 * Station specification for TST-IMP-04.
 * Verifies that an unresolved bare package import emits no warning and keeps its reference external.
 * Proves primary SPEC ID anchor TST-IMP-04.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-IMP-04',
  async verify({ api }) {
    expect(api.getWarnings()).toEqual([])

    const holder = await api.loadSymbolByName('Holder')
    const value = findMember(holder, 'value').getType()
    expect(value?.getKind()).toBe('reference')
    expect(value?.getRaw()).toEqual({
      id: 'Thing',
      name: 'Thing',
      library: 'tasty-station-absent-package',
    })
  },
}

export default spec
