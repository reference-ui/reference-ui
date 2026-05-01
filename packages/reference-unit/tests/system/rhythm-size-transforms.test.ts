/**
 * Unit tests for the reference-core rhythm `size` utility.
 */

import { describe, expect, it } from 'vitest'
import { rhythmUtilities } from '../../../reference-core/src/system/panda/config/extensions/rhythm/utilities'

describe('rhythmUtilities size transform', () => {
  // MIGRATED: Covered by matrix/spacing/tests/unit/runtime.test.ts.
  it.skip('maps rhythm units to equal width and height values', () => {
    expect(rhythmUtilities.size.transform('2r')).toEqual({
      width: 'calc(2 * var(--spacing-root))',
      height: 'calc(2 * var(--spacing-root))',
    })
  })

  // MIGRATED: Covered by matrix/spacing/tests/unit/runtime.test.ts.
  it.skip('passes through literal CSS values for width and height', () => {
    expect(rhythmUtilities.size.transform('3rem')).toEqual({
      width: '3rem',
      height: '3rem',
    })
  })
})