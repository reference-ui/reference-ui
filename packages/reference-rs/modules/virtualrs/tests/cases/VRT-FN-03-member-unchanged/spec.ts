/**
 * Test station specification for VRT-FN-03.
 * Verifies that member expressions are preserved without replacement.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-FN-03',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("const nested = theme.css({ color: 'blue.500' })")
    expect(result.code).toContain('const local = css')
  },
}

export default spec
