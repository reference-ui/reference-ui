/**
 * Station specification for ATL-PAIR-01-co-usage.
 * Validates deterministic component co-usage calculation and frequency-based
 * usage rating prioritization.
 * Proves primary SPEC anchor ATL-PAIR-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-PAIR-01',
  verify(result) {
    const button = result.components.find(c => c.name === 'Button')!
    expect(button).toBeDefined()
    expect(button.usedWith).toBeDefined()
    expect(button.usedWith!.Card).toBeDefined()
    expect(button.usedWith!.Badge).toBeDefined()
    expect(button.usedWith!.Card).toBe('very common')
    expect(button.usedWith!.Badge).not.toBe('unused')
  },
}

export default spec
