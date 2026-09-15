/**
 * Test station specification for VRT-CSS-02.
 * Verifies CSS import rewriting with aliased imports and mixed specifiers.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-CSS-02',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain("import { css } from 'src/system/runtime'")
    expect(result.code).toContain("import React, { Box as Card } from '@reference-ui/react'")
  },
}

export default spec
