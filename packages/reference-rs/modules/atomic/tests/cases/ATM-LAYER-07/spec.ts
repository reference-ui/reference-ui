/**
 * Shared-wrapper station. Three `sm` utilities share one `@container` block.
 * Nested `sm:` object keys are not extract conditions; array slot 1 is `sm`.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const WRAP = '@container (min-width: 640px)'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-07',
  verify(result) {
    expect(hasWant(result, 'p', '1r', ['sm'])).toBe(true)
    expect(hasWant(result, 'mt', '2r', ['sm'])).toBe(true)
    expect(hasWant(result, 'color', 'n100', ['sm'])).toBe(true)
    const sheet = result.stylesheet
    expect(sheet.split(WRAP).length).toBe(2)
    const open = sheet.indexOf(WRAP)
    const inner = sheet.slice(open, sheet.indexOf('}\n}', open) + 1)
    expect(inner).toContain('.sm\\:p_1r')
    expect(inner).toContain('.sm\\:mt_2r')
    expect(inner).toContain('.sm\\:c_n100')
  },
}

export default spec
