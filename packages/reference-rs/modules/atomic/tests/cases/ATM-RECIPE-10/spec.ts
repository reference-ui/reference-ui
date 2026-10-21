/**
 * Slotted recipe case. One `recipe({ slots })` call lowers to one closed recipe per
 * slot under `{className}__{slot}`: each slot table ships only the cells that style
 * it plus every default, compounds land on the slots their css names, and every
 * slot shares its call's gate (observed triples, dynamic full matrix, uncalled none).
 */
import { expect } from 'vitest'
import { hasWant, layerBody, layerClassNames, type AtomicCaseSpec } from '../../harness/helpers.js'

const LIB = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-10',
  verify(result) {
    expect(Object.keys(result.runtime.recipes).sort()).toEqual([
      `${LIB}__banner__icon`,
      `${LIB}__banner__root`,
      `${LIB}__card__body`,
      `${LIB}__card__root`,
      `${LIB}__card__title`,
      `${LIB}__panel__root`,
    ])
    const root = result.runtime.recipes[`${LIB}__card__root`]!
    expect(root.variantMap).toEqual({ size: ['sm', 'lg'], tone: ['quiet', 'loud'] })
    expect(root.defaultVariants).toEqual({ size: 0, tone: 0, on: 'false' })
    expect(root.compoundVariants).toEqual([])
    const title = result.runtime.recipes[`${LIB}__card__title`]!
    expect(title.variantMap).toEqual({ size: ['sm', 'lg'], tone: ['loud'] })
    expect(title.defaultVariants).toEqual({ size: 0, tone: 'quiet', on: 'false' })
    expect(title.compoundVariants).toEqual([{ predicates: { size: ['lg'], tone: ['loud'] } }])
    const body = result.runtime.recipes[`${LIB}__card__body`]!
    expect(body.variantMap).toEqual({ on: ['true', 'false'] })
    expect(body.defaultVariants).toEqual({ size: 'sm', tone: 'quiet', on: 1 })
    expect(result.runtime.recipes[`${LIB}__panel__root`]!.variantMap).toEqual({})

    const names = layerClassNames(result.stylesheet, 'recipes')
    for (const cls of [
      `${LIB}__card__root__base`,
      `${LIB}__card__title__base`,
      `${LIB}__card__root_s_lg`,
      `${LIB}__card__title_t_loud`,
      `${LIB}__card__title_c_lg_loud`,
      `${LIB}__card__body_o_true`,
      `${LIB}__card__body_o_false`,
    ]) {
      expect(names.has(cls), cls).toBe(true)
    }
    // A slot with no base styles still ships a table but prints no base rule.
    expect(names.has(`${LIB}__card__body__base`)).toBe(false)
    // The observed (size, lg, md) triple prints on every slot with a size cell, and nothing else.
    expect(names.has(`md:${LIB}__card__root_s_lg`)).toBe(true)
    expect(names.has(`md:${LIB}__card__title_s_lg`)).toBe(true)
    expect(names.has(`sm:${LIB}__card__root_s_lg`)).toBe(false)
    expect(names.has(`md:${LIB}__card__root_s_sm`)).toBe(false)
    // The dynamic banner call fails closed to the full responsive matrix on its icon slot.
    for (const breakpoint of result.runtime.responsiveBreakpoints ?? []) {
      for (const value of ['sm', 'lg']) {
        expect(names.has(`${breakpoint}:${LIB}__banner__icon_s_${value}`)).toBe(true)
      }
    }
    // The uncalled panel prints no rules.
    expect([...names].some(name => name.includes('__panel__'))).toBe(false)

    expect(layerBody(result.stylesheet, 'utilities')).toBe('')
    expect(hasWant(result, 'letterSpacing', '1px')).toBe(false)
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
