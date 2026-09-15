/**
 * recipe() call-site extract station. base, variant, and compoundVariants
 * css leaves compile as closed classes in @layer recipes, not utility wants.
 */
import { expect } from 'vitest'
import { hasWant, layerBody, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-03',
  verify(result) {
    expect(hasWant(result, 'fontWeight', 'bold')).toBe(false)
    expect(hasWant(result, 'bg', 'blue')).toBe(false)
    expect(hasWant(result, 'color', 'white')).toBe(false)
    expect(hasWant(result, 'border', '1px solid')).toBe(false)
    expect(hasWant(result, 'opacity', '0.9')).toBe(false)

    const recipes = layerBody(result.stylesheet, 'recipes')
    expect(recipes).toContain('.badge {')
    expect(recipes).toContain('font-weight: bold')
    expect(recipes).toContain('.badge--variant_solid')
    expect(recipes).toContain('background: blue')
    expect(recipes).toContain('color: white')
    expect(recipes).toContain('.badge--variant_outline')
    expect(recipes).toContain('border-width: 1px')
    expect(recipes).toContain('opacity: 0.9')
    expect(layerBody(result.stylesheet, 'utilities')).toBe('')

    const table = (result.recipes ?? []).find(r => r.className === 'badge')
    expect(table).toBeTruthy()
    expect(table?.variants.variant?.solid).toBe('badge--variant_solid')
    expect(table?.variants.variant?.outline).toBe('badge--variant_outline')
    const solid = table?.combinations.find(c => c.props.variant === 'solid')
    expect(solid?.className).toContain('badge--variant_solid')
    expect(solid?.className).toContain('badge--compound-variant_solid')
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
