/**
 * Seed station. Empty extract still returns the compile contract: layer
 * preamble, no utility rules, empty class map, no diagnostics. Fixture
 * tokens/global may fill those layers (ATM-LAYER-03).
 */
import { expect } from 'vitest'
import { LAYER_PREAMBLE, LIB_PACKAGE_OPEN, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-GHOST-03',
  verify(result) {
    expect(result.stylesheet.startsWith(`${LIB_PACKAGE_OPEN}\n${LAYER_PREAMBLE}`)).toBe(
      true
    )
    expect(result.stylesheet).not.toContain('@layer utilities')
    expect(result.css?.classes ?? {}).toEqual({})
    expect(result.diagnostics).toEqual([])
    expect(result.wants ?? []).toEqual([])
  },
}

export default spec
