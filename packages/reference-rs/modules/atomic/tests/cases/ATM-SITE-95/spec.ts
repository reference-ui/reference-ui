/**
 * Compiled-icon (ATM-SITE-95): the docs icon path. `icon-pkg` ships compiled
 * dist only (`dist/*.mjs`, jsx-runtime calls, no generics), the way `@reference-ui/icons`
 * does, so no source or declaration names what `CodeIcon` consumes and the tag stays an
 * external component at the call site; it publishes its system (`icons`) the way icons does,
 * so it is a Reference package. The package's published roster arrives as
 * `jsxOwned` on the base system: `CodeIcon` keeps `size` and `variant` for itself.
 * `size="lg"` mints no want and no warning, `color` still extracts, and the
 * `Div size="2r"` control still folds. With no upstream system composed, the styled
 * icon carries the one `ATM-W-EXTERNAL-UNBACKED`. The owned map the gate read rides the result.
 */
import { expect } from 'vitest'
import {
  compileCase,
  getWantsForProp,
  hasWant,
  type AtomicCaseSpec,
} from '../../harness/helpers.js'

const CASE = 'ATM-SITE-95'
const OWNED = { CodeIcon: ['size', 'variant'] }

const spec: AtomicCaseSpec = {
  id: CASE,
  async verify(result) {
    // Only the Div control wants a size; the icon's own `size="lg"` is silent.
    expect(getWantsForProp(result, 'size')).toHaveLength(1)
    expect(hasWant(result, 'size', '2r')).toBe(true)
    expect(hasWant(result, 'size', 'lg')).toBe(false)
    // Owned `size` reports nothing. The case compiles standalone, so nothing
    // backs the icon's `color`: the one line is that warning, once per tag.
    const diagnostics = result.diagnostics ?? []
    expect(diagnostics.map(line => line.code)).toEqual(['ATM-W-EXTERNAL-UNBACKED'])
    expect(diagnostics[0]?.message).toContain("<CodeIcon> will not paint: 'icon-pkg'")

    // `color` is not in the roster, so the external tag's color still extracts.
    expect(hasWant(result, 'color', 'red')).toBe(true)

    // The owned map the gate read rides the result, and the slim production wire too.
    expect(result.tracedJsxOwned).toEqual(OWNED)
    const slim = await compileCase(CASE, { logs: [] })
    expect(slim.tracedJsxOwned).toEqual(OWNED)
  },
}

export default spec
