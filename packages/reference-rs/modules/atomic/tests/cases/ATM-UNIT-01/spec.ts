/**
 * Numeric unit policy station (ATM-UNIT-01).
 * Asserts that dimensional properties gain `px`, unitless properties stay bare numbers,
 * zero stays bare (0, not 0px), and custom properties stay unitless.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-UNIT-01',
  verify(result) {
    // Dimensional properties gain px
    expect(result.stylesheet).toContain('width: 42px;')
    expect(result.stylesheet).toContain('.\\@reference-ui\\/lib__w_42')

    // Unitless properties stay bare
    expect(result.stylesheet).toContain('opacity: 1;')
    expect(result.stylesheet).toContain('z-index: 0;')
    expect(result.stylesheet).not.toContain('z-index: 0px;')
    expect(result.stylesheet).toContain('font-weight: 700;')
    expect(result.stylesheet).toContain('line-height: 1.5;')
    expect(result.stylesheet).toContain('--foo: 42;')

    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
