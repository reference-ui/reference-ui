/**
 * Named-breakpoint at-rule station. `sm`/`md`/`lg`/`xl`/`2xl` on `when`
 * print `@container (min-width: Npx)`. Array indexing is ATM-LEAF-05.
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
      expect(result.stylesheet).toContain(`.${name}\\:p_${value}`)
    }
  },
}

export default spec
