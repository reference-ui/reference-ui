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
    expect(recipes).toContain('badge__base')
    expect(recipes).toContain('font-weight: bold')
    expect(recipes).toContain('badge_v_solid')
    expect(recipes).toContain('background: blue')
    expect(recipes).toContain('color: white')
    expect(recipes).toContain('badge_v_outline')
    expect(recipes).toContain('border-width: 1px')
    expect(recipes).toContain('badge_c_solid')
    expect(recipes).toContain('opacity: 0.9')
    expect(layerBody(result.stylesheet, 'utilities')).toBe('')

    const table = (result.recipes ?? []).find(r => r.qualifiedName === '@reference-ui/lib__badge')
    expect(table).toBeTruthy()
    expect(table?.variantMap.variant).toEqual(['solid', 'outline'])
    expect(table?.combinations).toBeUndefined()
    const solidRecord = table?.compoundVariants.find(record => record.selection?.variant === 'solid')
    const solid = `@reference-ui/lib__badge__base @reference-ui/lib__badge_v_solid ${solidRecord?.className}`
    expect(solid).toContain('@reference-ui/lib__badge_v_solid')
    expect(solid).toContain('@reference-ui/lib__badge_c_solid')
    expect(solid).toContain('@reference-ui/lib__badge__base')
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
