/**
 * Observed-use gating station. Literal calls keep plain rules plus exactly
 * the observed responsive triples; a spread call fails closed to the full
 * matrix; uncalled, alias-imported, and bare definitions shake their rules
 * while every runtime table still builds.
 */
import { expect } from 'vitest'
import { layerBody, type AtomicCaseSpec } from '../../helpers.js'

const SM_QUERY = '@container (min-width: 640px)'
const MD_QUERY = '@container (min-width: 768px)'
const LG_QUERY = '@container (min-width: 1024px)'
const XL_QUERY = '@container (min-width: 1280px)'
const XXL_QUERY = '@container (min-width: 1536px)'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-09',
  verify(result) {
    const tables = result.recipes ?? []
    // B5 ships qualifiedName as the table identity (className dropped).
    expect(tables.map(table => table.qualifiedName).sort()).toEqual([
      '@reference-ui/lib__bare',
      '@reference-ui/lib__dynamic',
      '@reference-ui/lib__ghost',
      '@reference-ui/lib__observed',
      '@reference-ui/lib__uncalled',
    ])

    const recipes = layerBody(result.stylesheet, 'recipes')

    // Observed: plain matrix plus exactly the md/loud triple.
    expect(recipes).toContain('observed__base')
    expect(recipes).toContain('observed_t_loud')
    expect(recipes).toContain('observed_t_quiet')
    const mdSegments = recipes.split(MD_QUERY)
    expect(mdSegments.length).toBeGreaterThan(1)
    const loudSegment = mdSegments.find(segment =>
      segment.split('@container')[0]?.includes('observed_t_loud'),
    )
    expect(loudSegment).toBeDefined()
    const smSegments = recipes.split(SM_QUERY)
    expect(smSegments.length).toBeGreaterThan(1)
    for (const segment of smSegments.slice(1)) {
      expect(segment.split('@container')[0]).not.toContain('observed_t_')
    }

    // Dynamic: the spread call fails closed, so every query prints.
    expect(recipes).toContain('dynamic__base')
    expect(recipes).toContain(LG_QUERY)
    expect(recipes).toContain(XL_QUERY)
    expect(recipes).toContain(XXL_QUERY)

    // Uncalled, untraceable, and bare definitions print no rules at all.
    for (const stem of ['uncalled', 'ghost', 'bare']) {
      expect(recipes).not.toContain(`${stem}__base`)
    }
    expect(recipes).not.toContain('uncalled_s_sm')
    expect(recipes).not.toContain('ghost_k_plain')

    expect(layerBody(result.stylesheet, 'utilities')).toBe('')
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
