/**
 * Reset layer emission ahead of tokens and utilities.
 */
import { expect } from 'vitest'
import { LAYER_PREAMBLE, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-08',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet.startsWith(`@layer layer-reset {\n${LAYER_PREAMBLE}`)).toBe(true)
    const resetIdx = sheet.indexOf('@layer reset {')
    const tokensIdx = sheet.indexOf('@layer tokens {')
    const utilsIdx = sheet.indexOf('@layer utilities {')
    expect(resetIdx).toBeGreaterThan(-1)
    expect(tokensIdx).toBeGreaterThan(resetIdx)
    expect(utilsIdx).toBeGreaterThan(tokensIdx)
    expect(sheet).toContain('box-sizing: border-box')
    expect(sheet).toContain('body { margin: 0 }')
  },
}

export default spec
