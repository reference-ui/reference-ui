/**
 * Test station specification for VRT-CVA-02.
 * Verifies that multiple recipe imports consolidate into a primary runtime import.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-CVA-02',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("import { cva } from 'src/system/css'")
    expect(result.code).toContain('const card = cva({})')
  },
}

export default spec
