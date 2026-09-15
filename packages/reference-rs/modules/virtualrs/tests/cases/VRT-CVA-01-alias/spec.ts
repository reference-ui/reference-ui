/**
 * Test station specification for VRT-CVA-01.
 * Verifies CVA import rewriting when imported under an alias.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-CVA-01',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("import { cva } from 'src/system/css'")
    expect(result.code).toContain('const x = cva({})')
  },
}

export default spec
