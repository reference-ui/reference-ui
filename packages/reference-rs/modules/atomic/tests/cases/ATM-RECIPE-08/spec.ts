/**
 * Binding-inferred recipe identity station.
 * A missing `className` prop resolves from a `<Name>Recipe` declarator with
 * explicit-className parity; bare or non-suffixed bindings still refuse.
 */
import { expect } from 'vitest'
import { layerBody, layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const STEM = '@reference-ui/lib__chip'
const ESCAPED_STEM = '\\@reference-ui\\/lib__chip'
const IDENTITY_MESSAGE = "requires an explicit string-literal 'className' property"

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-08',
  verify(result) {
    // Inferred table: same shape an explicit `className: 'chip'` would emit.
    const tables = result.recipes ?? []
    expect(tables).toHaveLength(1)
    const table = tables[0]!
    expect(table.qualifiedName).toBe(STEM)
    expect(table.variantMap.tone).toEqual(['soft', 'accent'])
    expect(table.variantMap.radius).toEqual(['pill', 'rounded'])
    expect(table.defaultVariants).toEqual({ tone: 'soft', radius: 'rounded' })

    // Both refusal arms fire with file/line/column at the object literal.
    expect(result.diagnostics).toHaveLength(2)
    const [bare, plain] = result.diagnostics
    for (const diagnostic of [bare!, plain!]) {
      expect(diagnostic.message).toContain(IDENTITY_MESSAGE)
      expect(diagnostic.file).toMatch(/input\/src\/recipe\.ts$/)
    }
    expect([bare!.line, bare!.column]).toEqual([20, 23])
    expect([plain!.line, plain!.column]).toEqual([25, 22])

    // The inferred classes print in `@layer recipes`; nothing leaks elsewhere.
    const recipes = layerBody(result.stylesheet, 'recipes')
    expect(recipes).toContain(`.${ESCAPED_STEM}__base {`)
    const names = layerClassNames(result.stylesheet, 'recipes')
    for (const className of [
      `${STEM}__base`,
      `${STEM}_t_soft`,
      `${STEM}_t_accent`,
      `${STEM}_r_pill`,
      `${STEM}_r_rounded`,
    ]) {
      expect(names.has(className)).toBe(true)
    }
    expect(layerBody(result.stylesheet, 'utilities')).toBe('')
    expect(result.stylesheet).not.toContain('@media screen')
  },
}

export default spec
