/**
 * Variant table station. CompileResult.recipes maps variant prop
 * combinations (and compounds) to closed recipe class names.
 */
import { expect } from 'vitest'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-02',
  verify(result) {
    const tables = result.recipes ?? []
    expect(tables).toHaveLength(1)
    const table = tables[0]!
    expect(table.qualifiedName).toBe('@reference-ui/lib__button')
    expect(table.className).toBe('button')
    expect(table.base).toBe('@reference-ui/lib__button__base')
    expect(table.variantMap.variant?.solid).toBe('@reference-ui/lib__button_v_solid')
    expect(table.variantMap.variant?.outline).toBe('@reference-ui/lib__button_v_outline')
    expect(table.compoundVariants).toHaveLength(1)
    expect(table.compoundVariants[0]?.selection).toEqual({ variant: 'solid' })
    expect(table.compoundVariants[0]?.className).toBe('@reference-ui/lib__button_c_solid')

    expect(table.combinations['solid']?.split(' ')).toEqual([
      '@reference-ui/lib__button__base',
      '@reference-ui/lib__button_v_solid',
      '@reference-ui/lib__button_c_solid',
    ])
    expect(table.combinations['outline']?.split(' ')).toEqual([
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
