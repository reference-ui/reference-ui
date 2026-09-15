/**
 * Station specification for ATL-EXPT-01-default-exports.
 * Validates default export tracking, canonical component name preservation,
 * and call-site alias retention in usage examples.
 * Proves primary SPEC anchor ATL-EXPT-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-EXPT-01',
  verify(result) {
    const button = result.components.find(c => c.name === 'Button')!
    expect(button).toBeDefined()
    expect(button.count).toBe(2)
    expect(button.interface?.name).toBe('ButtonProps')
    expect(button.examples?.[0]).toMatch(/<PrimaryButton/)
  },
}

export default spec
