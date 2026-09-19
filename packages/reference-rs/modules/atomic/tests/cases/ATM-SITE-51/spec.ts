/**
 * Interpolated-template fold station (ATM-SITE-51, SPEC-V2-67). Templates
 * over foldable parts join one string per combination — const identifiers,
 * members, literals, wrappers, unary parts, nested templates, and
 * multi-leaf fan-out — with one want and one runtime plan per joined
 * string. Unfoldable parts refuse with a located diagnostic naming the
 * part while static siblings extract.
 */
import { expect } from 'vitest'
import { harvestWants, hasWant, siteWants, type AtomicCaseSpec } from '../../helpers.js'

const FOLDS: Array<{ prop: string; value: string | number | boolean }> = [
  { prop: 'width', value: '4px' },
  { prop: 'color', value: 'red' },
  { prop: 'backgroundImage', value: 'linear-gradient(red, blue)' },
  { prop: 'marginTop', value: '2px' },
  { prop: 'marginBottom', value: '4px' },
  { prop: 'padding', value: '4px' },
  { prop: 'margin', value: '4px' },
  { prop: 'marginTop', value: '-8px' },
  { prop: 'width', value: 'calc(2 * 8px)' },
  { prop: 'color', value: 'red' },
  { prop: 'padding', value: '8px' },
  { prop: 'fontFamily', value: 'true' },
  { prop: 'fontFamily', value: 'null' },
  { prop: 'fontFamily', value: 'null' },
  { prop: 'color', value: 'red' },
  { prop: 'color', value: 'blue' },
  { prop: 'borderColor', value: 'red' },
  { prop: 'borderColor', value: 'blue' },
  { prop: 'borderColor', value: 'red' },
  { prop: 'fontFamily', value: 'ace' },
  { prop: 'fontFamily', value: 'acf' },
  { prop: 'fontFamily', value: 'ade' },
  { prop: 'fontFamily', value: 'adf' },
  { prop: 'fontFamily', value: 'bce' },
  { prop: 'fontFamily', value: 'bcf' },
  { prop: 'fontFamily', value: 'bde' },
  { prop: 'fontFamily', value: 'bdf' },
  { prop: 'margin', value: '4px' },
  { prop: 'color', value: 'red' },
  { prop: 'margin', value: '4px' },
  { prop: 'padding', value: '2px' },
  { prop: 'marginTop', value: '1px' },
  { prop: 'marginBottom', value: '3px' },
  { prop: 'marginLeft', value: '5px' },
  { prop: 'paddingTop', value: '6px' },
  { prop: 'mt', value: '4r' },
  { prop: 'padding', value: '2r' },
  // The tail seam: `${2 + 3}` folds through the binary node and joins "5".
  { prop: 'order', value: '5' },
]

const PART_REFUSALS: Array<{
  file: string
  line: number
  column: number
  part: string
  detail: string
  prop: string
}> = [
  { file: 'refuse.ts', line: 3, column: 34, part: 'part 1', detail: "member 'props.w'", prop: 'width' },
  { file: 'refuse.ts', line: 4, column: 34, part: 'part 1', detail: "identifier 'missing'", prop: 'color' },
  { file: 'refuse.ts', line: 5, column: 34, part: 'part 1', detail: 'call expression', prop: 'color' },
  { file: 'refuse.ts', line: 10, column: 34, part: 'part 1', detail: "mutated binding 'shade'", prop: 'color' },
  { file: 'refuse.ts', line: 14, column: 35, part: 'part 1', detail: "identifier 'dyn'", prop: 'order' },
  { file: 'refuse.ts', line: 16, column: 34, part: 'part 1', detail: 'void expression', prop: 'color' },
  { file: 'fanout.ts', line: 8, column: 55, part: 'part 1', detail: 'call expression', prop: 'borderColor' },
  { file: 'App.tsx', line: 5, column: 30, part: 'part 1', detail: "identifier 'dyn'", prop: 'mt' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-51',
  verify(result) {
    // Every fold emits its wants: 38 across the five inputs. The mt sink
    // harvests six net-new lengths (1px/2px twin the site's marginTop
    // atoms); the width sink harvests seven (4px twins the site); the
    // color, borderColor, and order sinks find nothing net-new.
    for (const { prop, value } of FOLDS) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    expect(siteWants(result)).toHaveLength(38)
    expect(harvestWants(result)).toHaveLength(13)
    expect(result.wants ?? []).toHaveLength(51)

    // One runtime plan per unique resolvable leaf: the doubled color-red,
    // margin-4px, borderColor-red, and fontFamily-null wants share one plan
    // each (SITE-38 precedent: plans dedupe by prop+value+when).
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(44)
    for (const { prop, value } of FOLDS) {
      expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
    }

    // The `!` suffix applies to the joined string, on both sides.
    const importantWant = (result.wants ?? []).find(
      w => w.prop === 'padding' && (w.value as { String: string }).String === '8px' && w.important,
    )
    expect(importantWant, 'joined important want').toBeDefined()
    const importantPlan = plans.find(p => p.prop === 'padding' && p.value === '8px' && p.important)
    expect(importantPlan, 'joined important plan').toBeDefined()

    // Eight part refusals: zero wants from those templates, one located
    // `ATM-W-DYNAMIC-TEMPLATE` diagnostic each, naming the part.
    const diagnostics = result.diagnostics ?? []
    for (const { file, line, column, part, detail, prop } of PART_REFUSALS) {
      const match = diagnostics.find(
        d =>
          d.code === 'ATM-W-DYNAMIC-TEMPLATE' &&
          d.file?.endsWith(file) &&
          d.line === line &&
          d.column === column &&
          d.message.includes(part) &&
          d.message.includes(detail) &&
          d.message.includes(`'${prop}'`),
      )
      expect(match, `missing template refusal ${detail} in ${file}:${line}:${column}`).toBeDefined()
      expect(match!.severity).toBe('warning')
    }

    // The over-cap fan-out refuses whole: no partial strings, one
    // diagnostic at the template, the margin sibling kept.
    const capped = diagnostics.find(
      d =>
        d.code === 'ATM-W-DYNAMIC-TEMPLATE' &&
        d.file?.endsWith('fanout.ts') &&
        d.line === 19 &&
        d.column === 31 &&
        d.message.includes('16 combinations exceed the 8-combination fan-out limit'),
    )
    expect(capped, 'over-cap whole-template refusal').toBeDefined()
    expect(hasWant(result, 'margin', '4px')).toBe(true)

    // A folded template under unary refuses the operator without leaking
    // string wants past it; the partial twin surfaces its part refusal.
    const unary = diagnostics.find(
      d =>
        d.code === 'ATM-W-DYNAMIC-UNARY' &&
        d.file?.endsWith('refuse.ts') &&
        d.line === 13 &&
        d.message.includes("operator '-'"),
    )
    expect(unary, 'unary refusal over a folded template').toBeDefined()

    const warnings = diagnostics.filter(d => d.severity === 'warning')
    const infos = diagnostics.filter(d => d.severity === 'info')
    expect(warnings).toHaveLength(10)
    expect(infos).toHaveLength(5)
    for (const d of infos) {
      expect(d.code).toBe('ATM-I-HARVEST-SINK')
    }

    expect(result.stylesheet).toContain('order: 5;')
    expect(result.stylesheet).toContain('width: 4px;')
    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('background-image: linear-gradient(red, blue);')
    expect(result.stylesheet).toContain('margin-top: 2px;')
    expect(result.stylesheet).toContain('margin-bottom: 4px;')
    expect(result.stylesheet).toContain('margin-top: -8px;')
    expect(result.stylesheet).toContain('width: calc(2 * 8px);')
    expect(result.stylesheet).toContain('padding: 8px !important;')
    expect(result.stylesheet).toContain('border-color: red;')
    expect(result.stylesheet).toContain('border-color: blue;')
    expect(result.stylesheet).toContain('margin-top: calc(4 * var(--spacing-root));')
  },
}

export default spec
