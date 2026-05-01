/**
 * Unit tests for the reference-core rhythm `size` utility.
 */

import { describe, expect, it } from 'vitest'
import { rhythmUtilities } from '../../../reference-core/src/system/panda/config/extensions/rhythm/utilities'

describe('rhythmUtilities size transform', () => {
  // TODO(matrix/spacing): Keep this local until matrix adds direct transform-level
  // coverage for the rhythm size utility.
  it('maps rhythm units to equal width and height values', () => {
    expect(rhythmUtilities.size.transform('2r')).toEqual({
      width: 'calc(2 * var(--spacing-root))',
      height: 'calc(2 * var(--spacing-root))',
    })
  })

  // TODO(matrix/spacing): Keep this local until matrix adds direct transform-level
  // coverage for literal size passthrough.
  it('passes through literal CSS values for width and height', () => {
    expect(rhythmUtilities.size.transform('3rem')).toEqual({
      width: '3rem',
      height: '3rem',
    })
  })
})