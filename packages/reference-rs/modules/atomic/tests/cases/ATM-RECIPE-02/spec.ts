/**
 * Variant table station. CompileResult.recipes carries the derivation inputs
 * (value-name lists, index defaults, unexpanded predicates, breakpoint
 * list) the runtime derives into closed recipe class names; nothing ships
 * pre-composed. Identity rides the runtime-map key, not the table.
 */
import { expect } from 'vitest'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-02',
  verify(result) {
    const tables = result.recipes ?? []
    expect(tables).toHaveLength(1)
    const table = result.runtime.recipes['@reference-ui/lib__button']!
    expect(table).toBeDefined()
    expect(table.qualifiedName).toBeUndefined()
    expect(table.variantKeys).toBeUndefined()
    expect(table.variantMap.variant).toEqual(['solid', 'outline'])
    expect(table.compoundVariants).toHaveLength(1)
    expect(table.compoundVariants[0]?.predicates).toEqual({ variant: ['solid'] })
    expect(table.compoundVariants[0]?.className).toBeUndefined()

    expect(table.combinations).toBeUndefined()
    expect(table.responsiveVariantMap).toBeUndefined()
    expect(table.responsiveBreakpoints).toBeUndefined()
    expect(result.runtime.responsiveBreakpoints).toEqual(['sm', 'md', 'lg', 'xl', '2xl'])

    const solid = ['@reference-ui/lib__button__base', '@reference-ui/lib__button_v_solid', '@reference-ui/lib__button_c_solid']
    expect(solid).toEqual([
      '@reference-ui/lib__button__base',
      '@reference-ui/lib__button_v_solid',
      '@reference-ui/lib__button_c_solid',
    ])
    const outline = ['@reference-ui/lib__button__base', '@reference-ui/lib__button_v_outline']
    expect(outline).toEqual([
      '@reference-ui/lib__button__base',
      '@reference-ui/lib__button_v_outline',
    ])

    const recipes = layerClassNames(result.stylesheet, 'recipes')
    for (const className of [
      '@reference-ui/lib__button__base',
      '@reference-ui/lib__button_v_solid',
      '@reference-ui/lib__button_v_outline',
      '@reference-ui/lib__button_c_solid',
    ]) {
      expect(recipes.has(className)).toBe(true)
    }
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
