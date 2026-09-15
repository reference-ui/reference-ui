/**
 * Test station specification for VRT-FN-01.
 * Verifies generic function replacement for css call sites.
 * Ensures rustApiMs performance metrics are recorded accurately.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { VirtualResult } from '../../helpers.js'

const spec: StationSpec<VirtualResult> = {
  id: 'VRT-FN-01',
  verify(result) {
    expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
    expect(result.code).toContain('const __reference_ui_css = css;')
    expect(result.code).toContain('const card = __reference_ui_css(')
    expect(result.code).toContain('const keepRef = css')
  },
}

export default spec
