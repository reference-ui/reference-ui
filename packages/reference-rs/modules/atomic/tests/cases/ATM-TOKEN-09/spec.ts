/**
 * Category-breadth station. One property per declared category resolves
 * to its var() form, and a bare spacing value on a zIndex prop passes
 * through silently — bare values never warn off color props (§11).
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-09',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('box-shadow: var(--shadows-card);')
    expect(sheet).toContain('width: var(--sizes-content);')
    expect(sheet).toContain('margin-top: var(--spacing-4);')
    expect(sheet).toContain('z-index: var(--z-index-modal);')
    expect(sheet).toContain('transition-timing-function: var(--easings-ease-out);')
    expect(sheet).toContain('transition-duration: var(--durations-fast);')
    expect(sheet).toContain('background-image: var(--gradients-hero);')
    expect(sheet).toContain('z-index: 2;')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
