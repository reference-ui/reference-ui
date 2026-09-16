/**
 * Recipe cascade-ordering seam proof. A closed recipe class carrying base plus
 * conditional atoms must print its base rule before every conditional rule at
 * equal specificity, or the conditional loses last-rule-wins. Covers the
 * responsive card threshold (@container), a viewport-height @media query, and
 * a shared sm/md/lg breakpoint trio ordered by parsed width, not string order.
 */
import { describe, expect, it } from 'vitest'
import { compileSync } from '../js/index.js'
import { layerBody, LIB_SYSTEM_SPEC } from './helpers.js'

function compileRecipe(source: string): string {
  const result = compileSync({
    baseSystem: LIB_SYSTEM_SPEC,
    files: [{ path: 'src/card.ts', content: source }],
  })
  expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([])
  return layerBody(result.stylesheet, 'recipes')
}

const RECIPE_IMPORT = `import { recipe } from '@reference-ui/react'\n`

describe('recipe atom ordering', () => {
  it('prints the base rule before a responsive @container conditional', () => {
    const body = compileRecipe(
      `${RECIPE_IMPORT}
export const card = recipe({
  className: 'card',
  base: { color: 'red.500', sm: { color: 'blue.600' } },
})
void card
`
    )
    const wrap = body.indexOf('@container (min-width: 640px)')
    expect(wrap).toBeGreaterThan(-1)
    expect(body.indexOf('card__base')).toBeLessThan(wrap)
  })

  it('prints the base rule before a viewport-height @media conditional', () => {
    const body = compileRecipe(
      `${RECIPE_IMPORT}
export const card = recipe({
  className: 'card',
  base: { color: 'red.500', '@media (min-height: 800px)': { color: 'blue.600' } },
})
void card
`
    )
    const wrap = body.indexOf('@media (min-height: 800px)')
    expect(wrap).toBeGreaterThan(-1)
    expect(body.indexOf('card__base')).toBeLessThan(wrap)
  })

  it('orders a shared breakpoint trio by width after the base rule', () => {
    const body = compileRecipe(
      `${RECIPE_IMPORT}
export const card = recipe({
  className: 'card',
  base: {
    color: 'red.500',
    lg: { color: 'green.500' },
    sm: { color: 'blue.600' },
    md: { color: 'yellow.500' },
  },
})
void card
`
    )
    const base = body.indexOf('card__base')
    const sm = body.indexOf('@container (min-width: 640px)')
    const md = body.indexOf('@container (min-width: 768px)')
    const lg = body.indexOf('@container (min-width: 1024px)')
    expect(sm).toBeGreaterThan(-1)
    expect(md).toBeGreaterThan(-1)
    expect(lg).toBeGreaterThan(-1)
    expect(base).toBeLessThan(sm)
    expect(sm).toBeLessThan(md)
    expect(md).toBeLessThan(lg)
  })
})
