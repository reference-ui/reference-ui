/**
 * Import-bound css()/recipe() station. Shadowed parameters and local
 * helpers named css must not extract. The live Reference import still does.
 */
import { expect } from 'vitest'
import { hasWant, layerBody, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-10',
  verify(result) {
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'display', 'flex')).toBe(true)
    expect(hasWant(result, 'fontWeight', 'bold')).toBe(false)
    expect(hasWant(result, 'color', 'red')).toBe(false)
    expect(hasWant(result, 'p', '1r')).toBe(false)
    expect(hasWant(result, 'mt', '2r')).toBe(false)
    expect(hasWant(result, 'bg', 'n300')).toBe(false)
    const recipes = layerBody(result.stylesheet, 'recipes')
    expect(recipes).toContain('button__base')
    expect(recipes).toContain('font-weight: bold')
    expect(recipes).not.toContain('padding')
    expect(result.recipes).toHaveLength(1)
    expect(result.recipes?.[0]?.qualifiedName).toBeUndefined()
    expect(Object.keys(result.runtime.recipes)).toEqual(['@reference-ui/lib__button'])
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
