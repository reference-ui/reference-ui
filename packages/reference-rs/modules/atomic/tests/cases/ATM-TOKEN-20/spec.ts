/**
 * Numeric modifiers beside tones. Slash opacity keeps the ATM-TOKEN-03
 * color-mix form byte for byte, while the tone sibling in the same call
 * draws the line amount. Exactly one utility references a tone custom
 * property, and the compile raises no diagnostic.
 */
import { expect } from 'vitest'
import { layerBody, type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-20',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('background: color-mix(in srgb, var(--colors-blue-600) 50%, transparent);')
    expect(sheet).toContain('border-color: color-mix(in srgb, var(--colors-red-500) 25%, transparent);')
    expect(sheet).toContain('outline-color: color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-line), transparent);')
    expect(layerBody(sheet, 'utilities').split('--tones-')).toHaveLength(2)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
