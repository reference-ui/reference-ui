/**
 * Seed station. Empty extract still returns the compile contract: layer
 * preamble, empty class map, no diagnostics. Wants must not appear.
 */
import { expect } from 'vitest'
import { LAYER_PREAMBLE, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-GHOST-03',
  ids: ['ATM-GHOST-03', 'ATM-LAYER-01', 'ATM-LAYER-02', 'ATM-DIAG-01'],
  verify(result) {
    expect(result.stylesheet).toBe(`${LAYER_PREAMBLE}\n`)
    expect(result.css?.classes ?? {}).toEqual({})
    expect(result.diagnostics).toEqual([])
    expect(result.wants ?? []).toEqual([])
  },
}

export default spec
