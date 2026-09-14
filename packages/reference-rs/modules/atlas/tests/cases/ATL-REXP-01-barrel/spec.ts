/**
 * Station specification for ATL-REXP-01-barrel.
 * Validates local component tracking and canonical interface propagation
 * across barrel re-export boundaries.
 * Proves primary SPEC anchor ATL-REXP-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-REXP-01',
  verify(result) {
    const button = result.components.find(c => c.name === 'Button')!
    const userBadge = result.components.find(c => c.name === 'UserBadge')!

    expect(button).toBeDefined()
    expect(userBadge).toBeDefined()
    expect(button.count).toBe(2)
    expect(userBadge.count).toBe(1)
    expect(button.interface?.name).toBe('ButtonProps')
  },
}

export default spec
