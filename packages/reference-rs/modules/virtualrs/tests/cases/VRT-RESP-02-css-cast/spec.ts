/**
 * Test station specification for VRT-RESP-02.
 * Verifies responsive lowering when css calls contain TypeScript type assertions.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-RESP-02',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("'@container (min-width: 420px)'")
  },
}

export default spec
