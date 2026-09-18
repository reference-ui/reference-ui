/**
 * Keyframe-ref station (ATM-LAYER-10, RS-16). Bodies carrying `{colors.brand}`
 * and `1r`/`4r` emit `var(--colors-brand)` plus the rhythm calc inside
 * `@keyframes grow`; refs no longer print literally. Keyframes are
 * spec-owned, so resolution emits no diagnostics.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-10',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('@keyframes grow {')
    expect(sheet).toContain('background-color: var(--colors-brand);')
    expect(sheet).toContain('width: var(--spacing-root);')
    expect(sheet).toContain('width: calc(4 * var(--spacing-root));')
    expect(sheet).not.toContain('{colors.brand}')
    expect(result.css?.classes).toEqual({
      'animation:grow': 'layer-keyframe-refs__anim_grow',
    })
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
