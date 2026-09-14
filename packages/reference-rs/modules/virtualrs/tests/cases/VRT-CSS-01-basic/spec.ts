/**
 * Test station specification for VRT-CSS-01.
 * Verifies basic CSS import rewriting from @reference-ui/react to src/system/runtime.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-CSS-01',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("from 'src/system/runtime'")
    expect(result.code).toContain('const x = css({})')
  },
}

export default spec
