/**
 * Border longhand tripwire. `border` / `borderTop` / `borderBottom` /
 * `outline` expand to width, style, and color longhands with no currentColor.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SHORT-04',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('border-width: 1px;')
    expect(sheet).toContain('border-style: solid;')
    expect(sheet).toContain('border-color: red;')
    expect(sheet).toContain('border-top-width: 1px;')
    expect(sheet).toContain('border-top-style: solid;')
    expect(sheet).toContain('border-top-color: red;')
    expect(sheet).toContain('border-bottom-width: 1px;')
    expect(sheet).toContain('border-bottom-style: solid;')
    expect(sheet).toContain('border-bottom-color: red;')
    expect(sheet).toContain('outline-width: 1px;')
    expect(sheet).toContain('outline-style: solid;')
    expect(sheet).toContain('outline-color: red;')
    expect(sheet.toLowerCase()).not.toContain('currentcolor')
  },
}

export default spec
