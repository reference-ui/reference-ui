/**
 * Value whitespace collapse station (ATM-SITE-47, SPEC-V2-14). Spaced
 * string twins and multiline backtick grids collapse outside quotes to one
 * class and one declaration per twin pair; quoted runs (`content`, quoted
 * font names) survive verbatim. Extract keeps raw wants; resolve
 * canonicalizes, so each twin pair shares one runtime class.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const GRID = '"preview name delete" "preview size delete"'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-47',
  verify(result) {
    // Extract keeps the raw spellings: 3 + 2 + 2 wants.
    expect(hasWant(result, 'fontFamily', 'Fira Sans')).toBe(true)
    expect(hasWant(result, 'fontFamily', 'Fira  Sans')).toBe(true)
    expect(hasWant(result, 'fontFamily', 'Fira   Sans')).toBe(true)
    expect(hasWant(result, 'content', '"x  y"')).toBe(true)
    expect(hasWant(result, 'fontFamily', "'Fira  Code', monospace")).toBe(true)
    const gridWants = getWantsForProp(result, 'gridTemplateAreas')
    expect(gridWants).toHaveLength(2)
    expect(
      gridWants.some(w => (w.value as { String: string }).String === GRID)
    ).toBe(true)
    expect(result.wants ?? []).toHaveLength(7)

    // The twins collapse to one class key each; quoted runs keep theirs.
    const classes = result.css?.classes ?? {}
    expect(classes['fontFamily:Fira Sans']).toBeDefined()
    expect(classes['fontFamily:Fira  Sans']).toBeUndefined()
    expect(classes['fontFamily:Fira   Sans']).toBeUndefined()
    expect(classes[`gridTemplateAreas:${GRID}`]).toBeDefined()
    expect(classes['content:"x  y"']).toBeDefined()
    expect(classes["fontFamily:'Fira  Code', monospace"]).toBeDefined()
    expect(Object.keys(classes)).toHaveLength(4)
    expect(result.atomCount).toBe(4)

    // Twin plans (keyed by raw spelling) resolve to one class.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(7)
    const firaPlans = plans.filter(
      p => p.prop === 'fontFamily' && String(p.value).replace(/\s+/g, ' ') === 'Fira Sans'
    )
    expect(firaPlans).toHaveLength(3)
    expect(
      new Set(firaPlans.flatMap(p => p.declarations.map(d => d.className))).size
    ).toBe(1)
    const gridPlans = plans.filter(p => p.prop === 'gridTemplateAreas')
    expect(gridPlans).toHaveLength(2)
    expect(
      new Set(gridPlans.flatMap(p => p.declarations.map(d => d.className))).size
    ).toBe(1)

    // One declaration per twin pair; quoted spacing untouched.
    expect(result.stylesheet).toContain('font-family: Fira Sans;')
    expect(result.stylesheet).not.toContain('Fira  Sans')
    expect(result.stylesheet.split('font-family: Fira Sans;')).toHaveLength(2)
    expect(result.stylesheet).toContain(`grid-template-areas: ${GRID};`)
    expect(result.stylesheet).toContain('content: "x  y";')
    expect(result.stylesheet).toContain("font-family: 'Fira  Code', monospace;")

    // The multiline backtick grid misses at runtime: extraction trims
    // the template's leading whitespace into the plan key, but runtime
    // queries the raw cooked bytes, so the exact raw key has no plan.
    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]!.severity).toBe('warning')
    expect(diagnostics[0]!.code).toBe('ATM-W-MISSING-STYLE-PLAN')
    expect(diagnostics[0]!.message).toContain('gridTemplateAreas')
    expect(diagnostics[0]!.message).toContain('has no compiled style plan')
  },
}

export default spec
