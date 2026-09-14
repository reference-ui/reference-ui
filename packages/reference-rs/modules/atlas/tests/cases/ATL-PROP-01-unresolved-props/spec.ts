/**
 * Station specification for ATL-PROP-01-unresolved-props.
 * Validates partial component result retention alongside explicit diagnostic
 * emission when referenced TypeScript interfaces cannot be resolved.
 * Proves primary SPEC anchor ATL-PROP-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-PROP-01',
  verify(result) {
    const names = result.components.map(c => c.name)
    expect(names).toContain('BrokenCard')

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'unresolved-props-type',
          componentName: 'BrokenCard',
          interfaceName: 'MissingProps',
        }),
      ])
    )
  },
}

export default spec
