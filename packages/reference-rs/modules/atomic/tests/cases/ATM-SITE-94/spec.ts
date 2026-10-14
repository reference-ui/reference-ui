/**
 * createIcon factory station (ATM-SITE-94). `CodeIcon` is a `createIcon` product: a
 * `forwardRef` over an inner function that destructures `size` by name and spreads the
 * rest into a `Div` shell. `size="lg"` on the icon mints no want and no warning, while
 * `p` rides `rest` and extracts. The `Div size="2r"` control proves the primitive still
 * folds `size`.
 */
import { expect } from 'vitest'
import {
  getWantsForProp,
  hasWant,
  type AtomicCaseSpec,
} from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-94',
  verify(result) {
    // Only the Div control wants a size; the icon's own `size="lg"` is silent.
    expect(getWantsForProp(result, 'size')).toHaveLength(1)
    expect(hasWant(result, 'size', '2r')).toBe(true)
    expect(hasWant(result, 'size', 'lg')).toBe(false)

    // `p` rides rest into the shell and keeps extracting.
    expect(hasWant(result, 'p', '2r')).toBe(true)

    const sheet = result.stylesheet
    expect(sheet).toContain('padding: calc(2 * var(--spacing-root));')
    expect(sheet).toContain('width: calc(2 * var(--spacing-root));')
    expect(sheet).not.toContain('width: lg;')
    expect(sheet).not.toContain('height: lg;')
    expect(sheet).not.toContain('size: lg;')

    // The owned `lg` token must not reach the resolver, so nothing warns.
    expect(result.diagnostics ?? []).toHaveLength(0)
  },
}

export default spec
