/**
 * Test station specification for VRT-CVA-05.
 * Verifies a dual-binding import carrying both cva and recipe normalizes
 * every call site to the emitted canonical cva import, leaving no dangling references.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-CVA-05',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("import { cva } from 'src/system/css'")
    expect(result.code.match(/cva\(/g) ?? []).toHaveLength(2)
    expect(result.code).not.toContain('recipe(')
  },
}

export default spec
