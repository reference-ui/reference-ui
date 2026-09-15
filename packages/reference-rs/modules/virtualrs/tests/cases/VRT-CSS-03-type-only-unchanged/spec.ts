/**
 * Test station specification for VRT-CSS-03.
 * Verifies that type-only imports remain untouched by runtime transforms.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-CSS-03',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("import type { css } from '@reference-ui/react'")
  },
}

export default spec
