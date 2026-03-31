import { describe, expect, it } from 'vitest'

import { analyzeDetailed } from '../../../../js/atlas'
import { getCaseInputDir, getComponents } from '../../helpers'

const CASE = 'unresolved_props_type'

describe('unresolved_props_type atlas case', () => {
  it('preserves partial component results when a props type is unresolved', async () => {
    const components = await getComponents(undefined, CASE)

    expect(components.map(component => component.name)).toContain('BrokenCard')
  })

  it('emits a diagnostic for the unresolved props type', async () => {
    const result = await analyzeDetailed(getCaseInputDir(CASE))

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'unresolved-props-type',
          componentName: 'BrokenCard',
          interfaceName: 'MissingProps',
        }),
      ])
    )
  })
})
