/**
 * Group/peer and arbitrary `&` station. Fixture wraps survive into the
 * sheet; `'&[data-slot=inner]'` is a css() key, not a JSX attribute.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-09',
  verify(result) {
    expect(hasWant(result, 'bg', 'blue.500', ['_groupHover'])).toBe(true)
    expect(hasWant(result, 'color', 'red.500', ['_peerFocus'])).toBe(true)
    expect(hasWant(result, 'mt', '2r', ['&[data-slot=inner]'])).toBe(true)
    expect(result.stylesheet).toContain(
      '.\\@reference-ui\\/lib__groupHover\\:bg_blue\\.500:is(:where(.group, [data-group]):is(:hover, [data-hover]) *)'
    )
    expect(result.stylesheet).toContain(
      '.\\@reference-ui\\/lib__peerFocus\\:c_red\\.500:is(:where(.peer, [data-peer]):is(:focus, [data-focus]) ~ *)'
    )
    expect(result.stylesheet).toContain('[data-slot=inner]')
    expect(result.stylesheet).toContain('margin-top:')
  },
}

export default spec
