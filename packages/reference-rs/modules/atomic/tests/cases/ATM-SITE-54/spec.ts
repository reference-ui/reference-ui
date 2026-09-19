/**
 * Specifier-resolution station (ATM-SITE-54, SPEC-V2-76 Ph4 row 1). Two
 * files declare `gap` with different values and two importers each read
 * ONLY their own target — the Ph4 exit bar, never crossing. The same
 * compile pins the four specifier rungs: relative joins, `tsconfig`
 * `paths`/`baseUrl`, extension and directory-index probing, and
 * `package.json` `exports` mapping into `node_modules` (via a manifest
 * target no direct subpath reaches). The `(path, export)` cache underneath
 * is pinned by the walk's `repeated_lookups_replay_the_cache` unit test.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import {
  getWantsForProp,
  hasWant,
  layerClassNames,
  type AtomicCaseSpec,
  type Want,
} from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const EXPECTED: Array<{ prop: string; value: string; className: string }> = [
  { prop: 'padding', value: '8px', className: `${SYSTEM}__p_8px` },
  { prop: 'padding', value: '4px', className: `${SYSTEM}__p_4px` },
  { prop: 'color', value: 'red', className: `${SYSTEM}__c_red` },
  { prop: 'color', value: 'blue', className: `${SYSTEM}__c_blue` },
  { prop: 'color', value: 'green', className: `${SYSTEM}__c_green` },
  { prop: 'color', value: 'purple', className: `${SYSTEM}__c_purple` },
]

function wantsIn(wants: Want[], file: string, prop: string): Want[] {
  return wants.filter(w => w.prop === prop && w.file?.endsWith(file))
}

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-54',
  verify(result) {
    const wants = result.wants ?? []

    // Every rung resolves to its declared value.
    for (const { prop, value } of EXPECTED) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    // Exactly one want per leaf: nothing unions, nothing doubles.
    expect(wants).toHaveLength(EXPECTED.length)
    expect(getWantsForProp(result, 'padding')).toHaveLength(2)
    expect(getWantsForProp(result, 'color')).toHaveLength(4)

    // The exit bar, per file: App reads b.ts only, Page reads a.ts only.
    const appPadding = wantsIn(wants, 'App.tsx', 'padding')
    expect(appPadding).toHaveLength(1)
    expect(JSON.stringify(appPadding[0]!.value)).toContain('8px')
    const pagePadding = wantsIn(wants, 'Page.tsx', 'padding')
    expect(pagePadding).toHaveLength(1)
    expect(JSON.stringify(pagePadding[0]!.value)).toContain('4px')

    // One runtime plan per unique leaf, each naming an emitted class.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(EXPECTED.length)
    const emitted = new Set(Object.values(result.css?.classes ?? {}))
    for (const { prop, value, className } of EXPECTED) {
      const plan = plans.find(p => p.prop === prop && p.value === value)
      expect(plan).toBeDefined()
      expect(plan!.system).toBe(SYSTEM)
      expect(plan!.when).toEqual([])
      expect(plan!.declarations.map(d => d.className)).toContain(className)
      for (const decl of plan!.declarations) {
        expect(emitted.has(decl.className)).toBe(true)
      }
    }

    // Both paddings and all four colors paint.
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    for (const { className } of EXPECTED) {
      expect(utilities).toContain(className)
    }
    expect(result.stylesheet).toContain('padding: 8px;')
    expect(result.stylesheet).toContain('padding: 4px;')
    expect(result.stylesheet).toContain('color: purple;')

    // The runtime index resolves every leaf to its class.
    const index = createStylePlanIndex(result.runtime)
    for (const { prop, value, className } of EXPECTED) {
      const merged = mergeStylePlans(index, [{ system: SYSTEM, prop, value }])
      expect(merged).toContain(className)
    }

    // All six rungs resolve: zero diagnostics.
    expect(result.diagnostics ?? []).toHaveLength(0)
  },
}

export default spec
