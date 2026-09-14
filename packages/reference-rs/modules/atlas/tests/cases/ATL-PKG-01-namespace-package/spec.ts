/**
 * Station specification for ATL-PKG-01-namespace-package.
 * Validates tracking of external package components consumed via TypeScript
 * namespace imports, including call-site counts and namespace example formatting.
 * Proves primary SPEC anchor ATL-PKG-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-PKG-01',
  verify(result) {
    const demoUi = result.withIncludes['@fixtures/demo-ui']
    expect(demoUi).toBeDefined()
    const button = demoUi!.find(c => c.name === 'Button')
    const badge = demoUi!.find(c => c.name === 'Badge')

    expect(button).toBeDefined()
    expect(badge).toBeDefined()
    expect(button?.count).toBe(2)
    expect(badge?.count).toBe(1)
    expect(button?.examples?.[0]).toMatch(/<DemoUi\.Button/)
  },
}

export default spec
