/**
 * Paths tones never take. A negated base, a CSS colour keyword and a value
 * on a non-colour prop keep their pre-tones output: each value is painted
 * raw under the diagnostic those paths already raised, and no utility
 * references a tone custom property.
 */
import { expect } from 'vitest'
import { layerBody, type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-23',
  verify(result) {
    const sheet = result.stylesheet
    expect(layerBody(sheet, 'utilities')).not.toContain('--tones-')
    expect(sheet).toContain('color: -blue.500/medium;')
    expect(sheet).toContain('background: white/medium;')
    expect(sheet).toContain('border-color: transparent/medium;')
    expect(sheet).toContain('box-shadow: blue.500/medium;')
    const messages = (code: string) =>
      result.diagnostics.filter(d => d.code === code).map(d => d.message)
    expect(messages('ATM-W-UNKNOWN-TOKEN-PATH')).toEqual([
      'unknown token path `-blue.500/medium`',
    ])
    expect(messages('ATM-W-UNKNOWN-COLOR')).toEqual([
      '`white/medium` is neither a color token nor a CSS color',
      '`transparent/medium` is neither a color token nor a CSS color',
    ])
    expect(messages('ATM-W-MALFORMED-OPACITY')).toEqual([
      'malformed opacity modifier `blue.500/medium`',
    ])
    expect(result.diagnostics).toHaveLength(4)
  },
}

export default spec
