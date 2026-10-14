/**
 * forwardRef owned-props station (ATM-SITE-93). `Tile` is a `forwardRef` whose props
 * type sits only in the generic, so its inner function carries no annotation. It pulls
 * `size` and `tone` out by name, so they are the component's own API: `size="lg"` mints
 * no want and no warning. `p` rides `rest` into `Div` and still extracts, and the
 * `Div size="2r"` control proves the primitive still folds `size`.
 */
import { expect } from 'vitest'
import {
  getWantsForProp,
  hasWant,
  type AtomicCaseSpec,
} from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-93',
  verify(result) {
    // Only the Div control wants a size; Tile's own `size="lg"` is silent.
    expect(getWantsForProp(result, 'size')).toHaveLength(1)
    expect(hasWant(result, 'size', '2r')).toBe(true)
    expect(hasWant(result, 'size', 'lg')).toBe(false)

    // `tone` is destructured too and is not a StyleProps name: it never wants.
    expect(getWantsForProp(result, 'tone')).toHaveLength(0)

    // `p` rides rest into Div and keeps extracting.
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
