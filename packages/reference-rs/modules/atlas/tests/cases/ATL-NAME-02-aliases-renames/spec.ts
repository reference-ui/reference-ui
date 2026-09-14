/**
 * Station specification for ATL-NAME-02-aliases-renames.
 * Validates canonical component name resolution and call-site counting
 * when local imports are renamed at consumption sites.
 * Proves primary SPEC anchor ATL-NAME-02.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-NAME-02',
  verify(result) {
    const button = result.components.find(c => c.name === 'Button')!
    const userBadge = result.components.find(c => c.name === 'UserBadge')!

    expect(button).toBeDefined()
    expect(userBadge).toBeDefined()
    expect(button.count).toBe(2)
    expect(userBadge.count).toBe(1)

    const names = result.components.map(c => c.name)
    expect(names).toContain('Button')
    expect(names).toContain('UserBadge')
    expect(names).not.toContain('PrimaryButton')
    expect(names).not.toContain('IdentityBadge')
  },
}

export default spec
