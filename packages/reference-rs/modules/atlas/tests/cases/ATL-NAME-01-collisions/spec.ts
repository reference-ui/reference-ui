/**
 * Station specification for ATL-NAME-01-collisions.
 * Validates distinct indexing and source separation for identically named components
 * residing in different local directories.
 * Proves primary SPEC anchor ATL-NAME-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-NAME-01',
  verify(result) {
    const buttons = result.components.filter(c => c.name === 'Button')

    expect(buttons).toHaveLength(2)
    expect(buttons.some(c => /marketing\/Button/.test(c.source))).toBe(true)
    expect(buttons.some(c => /forms\/Button/.test(c.source))).toBe(true)
  },
}

export default spec
