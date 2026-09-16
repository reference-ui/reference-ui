/**
 * css-attribute station. `<Div css={{ … }} />` extracts the same wants as
 * the equivalent `css({ … })` call: same atoms, same classes, one deduped set.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-14',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'color', 'blue.600', ['_hover'])).toBe(true)
    expect(getWantsForProp(result, 'mt')).toHaveLength(2)
    expect(getWantsForProp(result, 'color')).toHaveLength(2)
    const classes = Object.values(result.css?.classes ?? {})
    expect(classes.filter(name => name === '@reference-ui/lib__mt_2r')).toHaveLength(1)
    expect(result.stylesheet).toContain('margin-top: calc(2 * var(--spacing-root));')
    expect(result.stylesheet).toContain('color: var(--colors-blue-600);')
  },
}

export default spec
