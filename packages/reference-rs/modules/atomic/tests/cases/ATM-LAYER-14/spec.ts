/**
 * Keyframe-alias station (ATM-LAYER-14, RS-30). Keyframe bodies run props
 * through the canon alias table and values through the `css()` unit chain,
 * so `h: '4'` lowers to `height` plus the sizes token (or `px` when the
 * token is absent) instead of printing verbatim `h: 4`. Mirrors the Panda
 * `roll` keyframes test; the `css()` arms prove utility parity.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-14',
  verify(result) {
    expect(hasWant(result, 'h', '4')).toBe(true)
    expect(hasWant(result, 'h', '8')).toBe(true)

    const sheet = result.stylesheet
    expect(sheet).toContain('@keyframes roll {')
    expect(sheet).toContain('from { height: var(--sizes-4); }')
    expect(sheet).toContain('to { height: 8px; }')
    expect(sheet).not.toContain(' h:')
    expect(sheet).not.toContain('h: 4')
    expect(sheet).toContain('height: var(--sizes-4);')
    expect(sheet).toContain('height: 8px;')
    expect(result.css?.classes).toEqual({
      'h:4': 'layer-keyframe-alias__h_4',
      'h:8': 'layer-keyframe-alias__h_8',
    })
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
