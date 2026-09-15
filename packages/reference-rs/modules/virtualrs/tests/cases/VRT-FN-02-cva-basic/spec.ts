/**
 * Test station specification for VRT-FN-02.
 * Verifies generic function replacement for cva call sites.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-FN-02',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain('const __reference_ui_cva = cva;')
    expect(result.code).toContain('const button = __reference_ui_cva(')
    expect(result.code).toContain('const nested = __reference_ui_cva(')
  },
}

export default spec
