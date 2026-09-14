/**
 * Station specification for ATL-REXP-02-default-aliases.
 * Validates default export tracking through named re-export alias chains,
 * preserving canonical interface identity and call-site example aliases.
 * Proves primary SPEC anchor ATL-REXP-02.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-REXP-02',
  verify(result) {
    const button = result.components.find(c => c.name === 'Button')!

    expect(button).toBeDefined()
    expect(button.count).toBe(2)
    expect(button.interface?.name).toBe('ButtonProps')
    expect(button.examples[0]).toMatch(/<CTAButton/)
  },
}

export default spec
