/**
 * Closed recipe class station. Each variant permutation is one readable
 * class in @layer recipes. Those selectors must not appear in utilities.
 */
import { expect } from 'vitest'
import { hasWant, layerBody, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-01',
  verify(result) {
    const sheet = result.stylesheet
    const recipes = layerBody(sheet, 'recipes')
    const utilities = layerBody(sheet, 'utilities')
    expect(recipes).toContain('.button {')
    expect(recipes).toContain('font-weight: bold')
    expect(recipes).toContain('.button--variant_solid')
    expect(recipes).toContain('background: blue')
    expect(recipes).toContain('color: white')
    expect(recipes).toContain('.button--variant_outline')
    expect(recipes).toContain('border-width: 1px')
    expect(recipes).toContain('.button--compound-variant_solid')
    expect(recipes).toContain('opacity: 0.9')
    expect(utilities).toBe('')
    expect(sheet).not.toContain('.css-')
    expect(hasWant(result, 'fontWeight', 'bold')).toBe(false)
    expect(hasWant(result, 'bg', 'blue')).toBe(false)
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
