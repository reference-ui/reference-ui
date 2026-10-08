/**
 * Global-numeric station (ATM-UNIT-03, RS-26 + tails-a). Bare numbers and
 * numeric strings in `globalCss` unitize like `css()`: dimensional props
 * gain `px`, unitless-stay props, custom props, and zero stay bare. Tokens
 * still win on the stem when the scale holds the value. The Panda
 * `global-css.test.ts:243` shape is the driver.
 */
import { expect } from 'vitest'
import type { AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-UNIT-03',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain(
      ':is(body > p) ~ :is(body > p), :is(body > ul) ~ :is(body > ul) { margin-top: 10px }',
    )
    expect(sheet).toContain(
      '.dims { width: 42px; z-index: 5; line-height: 2; opacity: 1; --foo: 42 }',
    )
    expect(sheet).toContain(
      '.strs { margin-top: 10px; width: 42px; z-index: 5; opacity: 1; --bar: 42 }',
    )
    expect(sheet).not.toContain('margin-top: 10 }')
    expect(sheet).not.toContain('width: 42 }')

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
