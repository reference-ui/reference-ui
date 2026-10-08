/**
 * Station specification for ATL-SURF-01-demo-surface.
 * Validates baseline analysis across local components, composition wrappers,
 * and included external library package exports.
 * Proves primary SPEC anchor ATL-SURF-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-SURF-01',
  verify(result) {
    const directNames = result.components.map(c => c.name)
    expect(directNames).toContain('Button')
    expect(directNames).toContain('AppCard')
    expect(directNames).toContain('UserBadge')

    const demoUi = result.withIncludes['@fixtures/demo-ui']
    expect(demoUi).toBeDefined()
    const libNames = demoUi!.map(c => c.name)
    expect(libNames).toContain('Button')
    expect(libNames).toContain('Card')
    expect(libNames).toContain('Badge')
    expect(libNames).toContain('Stack')

    const button = result.components.find(c => c.name === 'Button')!
    expect(button.count).toBe(6)
    expect(button.interface?.name).toBe('ButtonProps')
    expect(button.interface?.source).toBe('@fixtures/demo-ui')
  },
}

export default spec
