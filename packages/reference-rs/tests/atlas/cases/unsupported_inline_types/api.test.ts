import { describe, expect, it } from 'vitest'

import { analyzeDetailed } from '../../../../js/atlas'
import { getCaseInputDir, getComponents } from '../../helpers'

const CASE = 'unsupported_inline_types'

describe('unsupported_inline_types atlas case', () => {
  it('does not silently index components with unsupported inline props types', async () => {
    const components = await getComponents(undefined, CASE)

    expect(components.map(component => component.name)).not.toContain('InlineBadge')
  })

  it('emits an explicit unsupported-props diagnostic', async () => {
    const result = await analyzeDetailed(getCaseInputDir(CASE))

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'unsupported-props-annotation',
          componentName: 'InlineBadge',
        }),
      ])
    )
  })
})