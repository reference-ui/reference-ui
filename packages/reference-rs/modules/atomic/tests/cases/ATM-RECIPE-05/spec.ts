/**
 * Compound variant emission order station.
 * Rules in @layer recipes must emit base first, simple variants second,
 * and compound variants last so that compound overrides win via CSS cascade source order.
 */
import { expect } from 'vitest'
import { layerBody, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-05',
  verify(result) {
    const sheet = result.stylesheet
    const recipes = layerBody(sheet, 'recipes')

    const baseIdx = recipes.indexOf('button__base')
    const sizeIdx = recipes.indexOf('button_s_lg')
    const toneIdx = recipes.indexOf('button_t_danger')
    const compoundIdx = recipes.indexOf('button_c_lg_danger')

    expect(baseIdx).toBeGreaterThan(-1)
    expect(sizeIdx).toBeGreaterThan(baseIdx)
    expect(toneIdx).toBeGreaterThan(baseIdx)
    expect(compoundIdx).toBeGreaterThan(sizeIdx)
    expect(compoundIdx).toBeGreaterThan(toneIdx)

    expect(recipes).toContain('padding: 25px')
    expect(recipes).toContain('border-color: darkred')

    const table = result.runtime.recipes['@reference-ui/lib__button']
    expect(table).toBeTruthy()
    expect(table?.compoundVariants).toHaveLength(1)
    expect(table?.compoundVariants[0]?.predicates).toEqual({
      size: ['lg'],
      tone: ['danger'],
    })
    expect(Object.keys(table?.compoundVariants[0]?.predicates ?? {})).toEqual([
      'size',
      'tone',
    ])
    expect(table?.compoundVariants[0]?.className).toBeUndefined()

    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
