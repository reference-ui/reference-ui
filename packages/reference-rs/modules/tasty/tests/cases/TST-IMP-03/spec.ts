/**
 * Case specification for TST-IMP-03.
 * Verifies that a dangling `export *` and a dangling `export { X } from` each warn once, and that
 * the names they would provide never reach the manifest while the barrel's own declarations do.
 * Proves primary SPEC ID anchor TST-IMP-03.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-IMP-03',
  async verify({ api }) {
    const unresolved = api
      .getWarnings()
      .filter(w => w.code === 'TST-W-UNRESOLVED-IMPORT')
    const specifiers = unresolved
      .map(w => /`([^`]+)`/.exec(w.message)?.[1])
      .sort()
    expect(specifiers).toEqual(['./missing-named', './missing-star'])
    expect(unresolved.every(w => w.file === 'cases/TST-IMP-03/input/index.ts')).toBe(true)

    expect(await api.findSymbolByName('Gone')).toBeUndefined()
    const local = await api.loadSymbolByName('Local')
    expect(local.getName()).toBe('Local')
  },
}

export default spec
