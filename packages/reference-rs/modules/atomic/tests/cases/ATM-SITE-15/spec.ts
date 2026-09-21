/**
 * Binding-identity station. Namespace `R.css` and the internal
 * `__reference_ui_css` / `__reference_ui_recipe` aliases extract;
 * type-only and default `css` imports produce no sites.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-15',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'px', '4r')).toBe(true)
    expect(hasWant(result, 'mb', '6r')).toBe(false)
    expect(hasWant(result, 'pt', '8r')).toBe(false)
    const classes = result.css?.classes ?? {}
    expect(classes['mt:2r']).toBe('@reference-ui/lib__mt_2r')
    expect(classes['px:4r']).toBe('@reference-ui/lib__px_4r')
    expect(Object.keys(classes)).toHaveLength(2)
    const badge = result.runtime.recipes['@reference-ui/lib__site15badge']
    expect(badge).toBeTruthy()
    expect(Object.keys(badge?.variantMap ?? {}).length).toBeGreaterThan(0)
    expect(result.stylesheet).toContain('@layer recipes')
  },
}

export default spec
