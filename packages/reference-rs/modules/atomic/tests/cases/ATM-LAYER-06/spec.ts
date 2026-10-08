/**
 * @font-face declarations emission inside @layer global.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-06',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('@layer global {')
    expect(sheet).toContain('@font-face {')
    expect(sheet).toContain('font-family: Inter;')
    expect(sheet).toContain('src: url(/fonts/inter.woff2);')
    expect(sheet).toContain('font-display: swap;')
    expect(sheet).toContain('font-weight: 400 700;')
    expect(sheet).toContain('font-family: "Fira Code";')
    expect(sheet).toContain('src: url(/fonts/fira-code.woff2);')
    expect(sheet).toContain('font-display: fallback;')
    expect(sheet).toContain('size-adjust: 104%;')
    expect(sheet).toContain('descent-override: 47%;')
    expect(sheet).toContain('size-adjust: 101%;')
    expect(sheet.match(/descent-override/g) ?? []).toHaveLength(1)
  },
}

export default spec
