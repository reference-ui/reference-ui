/**
 * Station specification for TST-IMP-02.
 * Verifies that a relative import with no file behind it warns once and keeps its type external.
 * Proves primary SPEC ID anchor TST-IMP-02.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-IMP-02',
  async verify({ api }) {
    const unresolved = api
      .getWarnings()
      .filter(w => w.code === 'TST-W-UNRESOLVED-IMPORT')
    expect(unresolved).toHaveLength(1)
    expect(unresolved[0]?.file).toBe('cases/TST-IMP-02/input/index.ts')
    expect(unresolved[0]?.message).toContain('`./missing`')

    const holder = await api.loadSymbolByName('Holder')
    const value = findMember(holder, 'value').getType()
    expect(value?.getKind()).toBe('reference')
    expect(value?.getRaw()).toEqual({ id: 'Missing', name: 'Missing', library: './missing' })
  },
}

export default spec
