/**
 * Responsive variant value station. Each variant value also compiles to one
 * `{breakpoint}:`-prefixed class per width breakpoint, wrapped in that
 * breakpoint's `@container` query, so a runtime `{ base: 'solid', md: 'outline' }`
 * selection paints by emitting both classes from the runtime table.
 */
import { expect } from 'vitest'
import {
  hasWant,
  layerBody,
  layerClassNames,
  type AtomicCaseSpec,
} from '../../helpers.js'

const STEM = '@reference-ui/lib__buttonStyle'
const ESCAPED_STEM = '\\@reference-ui\\/lib__buttonStyle'
const PLAIN_SOLID_RULE = `.${ESCAPED_STEM}_v_solid {`
const MD_OUTLINE = `.md\\:${ESCAPED_STEM}_v_outline`
const MD_QUERY = '@container (min-width: 768px)'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-07',
  verify(result) {
    const tables = result.recipes ?? []
    expect(tables).toHaveLength(1)
    const table = tables[0]!
    expect(table.qualifiedName).toBe(STEM)
    expect(table.variantMap.variant).toEqual(['solid', 'outline'])
    expect(table.defaultVariants).toEqual({ variant: 'solid' })

    expect(table.combinations).toBeUndefined()
    expect(table.responsiveVariantMap).toBeUndefined()
    expect(table.responsiveBreakpoints).toBeUndefined()
    expect(result.runtime.responsiveBreakpoints).toEqual(['sm', 'md', 'lg', 'xl', '2xl'])
    expect(result.runtime.responsiveBreakpoints).not.toContain('base')
    const mdSolid = `md:${STEM}_v_solid`
    const mdOutline = `md:${STEM}_v_outline`

    const recipes = layerBody(result.stylesheet, 'recipes')
    expect(recipes).toContain(PLAIN_SOLID_RULE)
    expect(recipes.indexOf(PLAIN_SOLID_RULE)).toBeLessThan(recipes.indexOf(MD_QUERY))

    const mdSegments = recipes.split(MD_QUERY)
    expect(mdSegments.length).toBeGreaterThan(1)
    const outlineSegment = mdSegments.find(segment => segment.includes(MD_OUTLINE))
    expect(outlineSegment).toBeDefined()
    const mdOutlineBlock = outlineSegment!.split('@container')[0]!
    expect(mdOutlineBlock).toContain(MD_OUTLINE)
    expect(mdOutlineBlock).toContain('border-width: 1px')
    expect(mdOutlineBlock).toContain(':is(:hover, [data-hover])')
    expect(mdOutlineBlock).toContain('data-disabled')

    const names = layerClassNames(result.stylesheet, 'recipes')
    for (const breakpoint of result.runtime.responsiveBreakpoints ?? []) {
      for (const [axis, values] of Object.entries(table.variantMap)) {
        for (const value of values) {
          expect(names.has(`${breakpoint}:${STEM}_${axis[0]}_${value}`)).toBe(true)
        }
      }
    }

    expect(layerBody(result.stylesheet, 'utilities')).toBe('')
    expect(result.stylesheet).not.toContain('@media screen')
    expect(hasWant(result, 'backgroundColor', 'blue')).toBe(false)
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
