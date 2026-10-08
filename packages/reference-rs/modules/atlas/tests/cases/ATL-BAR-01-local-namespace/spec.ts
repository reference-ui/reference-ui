/**
 * Station specification for ATL-BAR-01-local-namespace.
 * Validates local namespace imports exported through local barrel modules,
 * ensuring correct component identification and interface preservation.
 * Proves primary SPEC anchor ATL-BAR-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-BAR-01',
  verify(result) {
    const button = result.components.find(c => c.name === 'Button')!
    const badge = result.components.find(c => c.name === 'UserBadge')!

    expect(button).toBeDefined()
    expect(badge).toBeDefined()
    expect(button.count).toBe(2)
    expect(badge.count).toBe(1)
    expect(button.interface?.name).toBe('ButtonProps')
  },
}

export default spec
