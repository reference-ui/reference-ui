/**
 * Category-breadth station. One property per declared category resolves
 * to its var() form, and a spacing path on a zIndex prop warns while
 * passing its valid value through.
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
    expect(sheet).toContain('transition-timing-function: var(--easings-easeOut);')
    expect(sheet).toContain('transition-duration: var(--durations-fast);')
    expect(sheet).toContain('background-image: var(--gradients-hero);')
    expect(sheet).toContain('z-index: 2;')
    const messages = result.diagnostics.map(d => d.message)
    expect(messages.filter(m => m.includes('`2`'))).toHaveLength(1)
  },
}

export default spec
