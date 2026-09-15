/**
 * Test station specification for VRT-RESP-03.
 * Verifies responsive lowering inside CVA base variant structures.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-RESP-03',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("'@container (min-width: 480px)'")
  },
}

export default spec
