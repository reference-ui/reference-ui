/**
 * Test station specification for VRT-RESP-05.
 * Verifies mixed responsive transforms across css and cva definitions.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-RESP-05',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("'@container (min-width: 320px)'")
    expect(result.code).toContain("'@container (min-width: 480px)'")
    expect(result.code).toContain("'@container (min-width: 720px)'")
    expect(result.code).toContain("const config = { r: { 900: { padding: '9' } } };")
  },
}

export default spec
