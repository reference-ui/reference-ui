/**
 * Keyframes emission inside @layer global with from/to and percentage selectors.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-05',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('@layer global {')
    expect(sheet).toContain('@keyframes fadeIn {')
    expect(sheet).toContain('from { opacity: 0; }')
    expect(sheet).toContain('to { opacity: 1; }')
    expect(sheet).toContain('@keyframes pulse {')
    expect(sheet).toContain('0% { transform: scale(1); }')
    expect(sheet).toContain('50% { transform: scale(1.1); }')
    expect(sheet).toContain('100% { transform: scale(1); }')
  },
}

export default spec
