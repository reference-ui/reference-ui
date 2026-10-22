/**
 * Recipe const resolution case. A recipe field that names a module-level const object literal
 * lowers exactly as if written inline: base, a variant value, a spread variant source, a whole
 * variants map, an axis map, a compound's css, and a slot entry. Each resolved field prints its
 * CSS and no diagnostic is raised.
 */
import { expect } from 'vitest'
import { layerBody, layerClassNames, type AtomicCaseSpec } from '../../harness/helpers.js'

const LIB = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-14',
  verify(result) {
    expect(result.diagnostics).toHaveLength(0)
    expect(Object.keys(result.runtime.recipes).sort()).toEqual([
      `${LIB}__badge`,
      `${LIB}__card__root`,
      `${LIB}__card__title`,
      `${LIB}__chip`,
      `${LIB}__lamp`,
      `${LIB}__pill`,
    ])
    const chip = result.runtime.recipes[`${LIB}__chip`]!
    expect(Object.keys(chip.variantMap).sort()).toEqual(['size', 'tone'])
    expect([...(chip.variantMap.size ?? [])].sort()).toEqual(['lg', 'sm'])
    expect(chip.variantMap.tone).toEqual(['loud'])

    const names = layerClassNames(result.stylesheet, 'recipes')
    for (const cls of [
      `${LIB}__chip__base`,
      `${LIB}__chip_s_lg`,
      `${LIB}__chip_s_sm`,
      `${LIB}__chip_t_loud`,
      `${LIB}__badge_s_sm`,
      `${LIB}__pill_t_loud`,
      `${LIB}__pill_c_loud`,
      `${LIB}__card__root__base`,
      `${LIB}__card__title__base`,
      `${LIB}__card__root_s_sm`,
      `${LIB}__lamp_s_sm`,
    ]) {
      expect(names.has(cls), cls).toBe(true)
    }
    // A slot keeps only the axes it styles, so the title slot has no size cell.
    expect(names.has(`${LIB}__card__title_s_sm`)).toBe(false)

    const body = layerBody(result.stylesheet, 'recipes')
    for (const declaration of [
      'color: red',
      'font-size: 20px',
      'font-size: 12px',
      'color: blue',
      'font-weight: 600',
      'display: flex',
      'padding: 12px',
    ]) {
      expect(body, declaration).toContain(declaration)
    }
  },
}

export default spec
