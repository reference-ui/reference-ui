/**
 * Global bare-token station (ATM-LAYER-15, RS-35). `globalCss` values
 * resolve bare token names through the shared value resolver with the
 * authored prop, so category lookup fires exactly like the atomic path.
 */
import { expect } from 'vitest'
import type { AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-15',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('body { font-family: var(--fonts-sans) }')
    expect(sheet).toContain('border-radius: var(--radii-md)')
    expect(sheet).toContain('outline-color: var(--colors-ui-focus-ring)')
    expect(sheet).toContain('display: flex')
    expect(sheet).not.toContain('font-family: sans;')
    expect(sheet).not.toContain('border-radius: md')
    expect(sheet).not.toContain('outline-color: ui.focus.ring')

    expect(result.diagnostics).toEqual([])
  },
}

export default spec
