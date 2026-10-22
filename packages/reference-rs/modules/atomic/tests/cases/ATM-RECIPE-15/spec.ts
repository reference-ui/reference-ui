/**
 * Recipe const-string case. A compound predicate or a default that names a same-file const string
 * or boolean reads as that literal, so a compound applies only to the values it names and a default
 * resolves to its variant. The plain recipes and the slotted recipe read the same predicates and
 * defaults, and every slot of the slotted recipe carries them. No diagnostic is raised.
 */
import { expect } from 'vitest'
import { layerBody, layerClassNames, type AtomicCaseSpec } from '../../harness/helpers.js'

const LIB = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-15',
  verify(result) {
    expect(result.diagnostics).toHaveLength(0)
    expect(Object.keys(result.runtime.recipes).sort()).toEqual([
      `${LIB}__card__root`,
      `${LIB}__card__title`,
      `${LIB}__chip`,
      `${LIB}__pill`,
      `${LIB}__tag`,
    ])

    // A const predicate reads as its string, beside a literal predicate: the compound names both.
    const recipes = result.runtime.recipes
    expect(recipes[`${LIB}__chip`]!.compoundVariants).toEqual([
      { predicates: { tone: ['loud'], size: ['sm'] } },
    ])
    expect(recipes[`${LIB}__tag`]!.compoundVariants).toEqual([
      { predicates: { tone: ['loud'] } },
    ])
    expect(recipes[`${LIB}__pill`]!.compoundVariants).toEqual([
      { predicates: { on: ['true'], tone: ['loud'] } },
    ])
    for (const slot of ['root', 'title']) {
      expect(recipes[`${LIB}__card__${slot}`]!.compoundVariants).toEqual([
        { predicates: { tone: ['loud'], size: ['sm'] } },
      ])
    }

    // A const default resolves to its variant's index, as a literal default does.
    expect(recipes[`${LIB}__chip`]!.defaultVariants).toEqual({ size: 1 })
    expect(recipes[`${LIB}__card__root`]!.defaultVariants).toEqual({ size: 1 })
    expect(recipes[`${LIB}__card__title`]!.defaultVariants).toEqual({ size: 1 })

    // Each compound is named by its values, so the class shows which tone it styles.
    const names = layerClassNames(result.stylesheet, 'recipes')
    for (const cls of [
      `${LIB}__chip_c_loud_sm`,
      `${LIB}__tag_c_loud`,
      `${LIB}__pill_c_on_loud`,
      `${LIB}__card__root_c_loud_sm`,
      `${LIB}__card__title_c_loud_sm`,
    ]) {
      expect(names.has(cls), cls).toBe(true)
    }
    // The widened names, a compound that applies to every tone, are never emitted.
    expect(names.has(`${LIB}__chip_c_sm`)).toBe(false)
    expect(names.has(`${LIB}__card__root_c_sm`)).toBe(false)

    const body = layerBody(result.stylesheet, 'recipes')
    for (const declaration of [
      'font-weight: 700',
      'text-decoration: underline',
      'letter-spacing: 1px',
    ]) {
      expect(body, declaration).toContain(declaration)
    }
  },
}

export default spec
