/**
 * Unknown-helper station. sva / tw / cx calls are not extract sites.
 * No wants leak from their style-shaped object arguments.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-04',
  verify(result) {
    expect(result.wants ?? []).toEqual([])
    expect(result.css?.classes ?? {}).toEqual({})
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
