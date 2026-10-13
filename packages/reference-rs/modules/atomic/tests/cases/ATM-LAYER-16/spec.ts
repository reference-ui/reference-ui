/**
 * Classification by exact source. Only the normalizeCss reset fragment prints in
 * `@layer reset`. User fragments whose paths mention reset or preset print in
 * `@layer global`, and neither user rule crosses into the reset layer.
 */
import { expect } from 'vitest'
import { layerBody, type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-16',
  verify(result) {
    const reset = layerBody(result.stylesheet, 'reset')
    const global = layerBody(result.stylesheet, 'global')
    expect(reset).toContain('body { margin: 0 }')
    expect(global).toContain('h2 { font-weight: 700 }')
    expect(global).toContain('button { cursor: pointer }')
    expect(reset).not.toContain('font-weight')
    expect(reset).not.toContain('cursor')
    expect(global).not.toContain('margin: 0')
  },
}

export default spec
