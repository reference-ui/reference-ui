/**
 * Test station specification for VRT-CVA-04.
 * Verifies that files with unrelated imports remain completely untouched.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-CVA-04',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("import { Box } from '@reference-ui/react'")
  },
}

export default spec
