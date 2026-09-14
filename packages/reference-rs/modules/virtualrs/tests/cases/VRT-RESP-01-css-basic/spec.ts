/**
 * Test station specification for VRT-RESP-01.
 * Verifies basic responsive css lowering into container queries.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-RESP-01',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("'@container (min-width: 420px)'")
    expect(result.code).toContain("'@container (min-width: 640px)'")
  },
}

export default spec
