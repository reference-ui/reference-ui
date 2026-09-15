/**
 * Named-breakpoint at-rule station. `sm`/`md`/`lg`/`xl`/`2xl` on `when`
 * print `@container (min-width: Npx)`. Array indexing is ATM-LEAF-05.
 * Digit-leading `2xl` uses the NAME-06 hex escape in the selector.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const WIDTHS = [
  ['sm', '640', '2r'],
  ['md', '768', '3r'],
  ['lg', '1024', '4r'],
  ['xl', '1280', '5r'],
  ['2xl', '1536', '6r'],
] as const

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-01',
  verify(result) {
    expect(hasWant(result, 'p', '1r', ['base'])).toBe(true)
    for (const [name, px, value] of WIDTHS) {
      expect(hasWant(result, 'p', value, [name])).toBe(true)
      expect(result.stylesheet).toContain(`@container (min-width: ${px}px)`)
    }
    expect(result.stylesheet).toContain('.sm\\:p_2r')
    expect(result.stylesheet).toContain('.md\\:p_3r')
    expect(result.stylesheet).toContain('.lg\\:p_4r')
    expect(result.stylesheet).toContain('.xl\\:p_5r')
    expect(result.stylesheet).toContain('.\\32 xl\\:p_6r')
    expect(result.stylesheet).not.toContain('.2xl\\:')
    const order = WIDTHS.map(([, px]) =>
      result.stylesheet.indexOf(`@container (min-width: ${px}px)`)
    )
    for (let i = 1; i < order.length; i++) {
      expect(order[i]).toBeGreaterThan(order[i - 1]!)
    }
  },
}

export default spec
