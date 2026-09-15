/**
 * Variant table station. CompileResult.recipes maps variant prop
 * combinations (and compounds) to closed recipe class names.
 */
import { expect } from 'vitest'
import { classSelector, layerBody, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-02',
  verify(result) {
    const tables = result.recipes ?? []
    expect(tables).toHaveLength(1)
    const table = tables[0]!
    expect(table.name).toBe('button')
    expect(table.className).toBe('button')
    expect(table.variants.variant?.solid).toBe('button--variant_solid')
    expect(table.variants.variant?.outline).toBe('button--variant_outline')
    expect(table.compoundVariants).toHaveLength(1)
    expect(table.compoundVariants[0]?.props).toEqual({ variant: 'solid' })
    expect(table.compoundVariants[0]?.className).toBe(
      'button--compound-variant_solid'
    )

    const base = table.combinations.find(c => Object.keys(c.props).length === 0)
    expect(base?.className).toBe('button')
    const solid = table.combinations.find(c => c.props.variant === 'solid')
    expect(solid?.className.split(' ')).toEqual([
      'button',
      'button--variant_solid',
      'button--compound-variant_solid',
    ])
    const outline = table.combinations.find(c => c.props.variant === 'outline')
    expect(outline?.className.split(' ')).toEqual([
      'button',
      'button--variant_outline',
    ])

    const recipes = layerBody(result.stylesheet, 'recipes')
    for (const className of [
      'button',
      'button--variant_solid',
      'button--variant_outline',
      'button--compound-variant_solid',
    ]) {
      expect(recipes).toContain(classSelector(className))
    }
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
