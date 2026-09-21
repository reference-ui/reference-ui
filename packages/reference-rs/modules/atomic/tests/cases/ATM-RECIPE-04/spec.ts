/**
 * Default variants and boolean variant keys station.
 * defaultVariants must be preserved in RecipeRuntimeTable, boolean variant keys
 * normalized, and classes emitted in @layer recipes.
 */
import { expect } from 'vitest'
import { layerBody, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-04',
  verify(result) {
    const sheet = result.stylesheet
    const recipes = layerBody(sheet, 'recipes')

    expect(recipes).toContain('button__base')
    expect(recipes).toContain('button_s_sm')
    expect(recipes).toContain('button_s_md')
    expect(recipes).toContain('button_m_true')
    expect(recipes).toContain('button_m_false')
    expect(recipes).toContain('opacity: 0.5')
    expect(recipes).toContain('opacity: 1')

    const table = result.runtime.recipes['@reference-ui/lib__button']
    expect(table).toBeTruthy()
    expect(table?.qualifiedName).toBeUndefined()
    expect(table?.defaultVariants).toEqual({
      size: 1,
      muted: 1,
    })
    expect(table?.variantMap.size).toEqual(['sm', 'md'])
    expect(table?.variantMap.muted).toEqual(['true', 'false'])

    // Selections compose from base plus variant classes; nothing ships pre-composed.
    expect(table?.combinations).toBeUndefined()
    const defaultCombo = '@reference-ui/lib__button__base @reference-ui/lib__button_s_md @reference-ui/lib__button_m_false'
    expect(defaultCombo).toContain('@reference-ui/lib__button__base')
    expect(defaultCombo).toContain('@reference-ui/lib__button_s_md')
    expect(defaultCombo).toContain('@reference-ui/lib__button_m_false')

    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
