/**
 * Declaration-root station (ATM-SITE-91). `brand-pkg` carries `types` naming a
 * body-less declaration beside an `exports` entry that names its real source,
 * the root shape styletrace STT-PKG-04 pins. `App.tsx` reads `brand` through
 * the package, so the value must fold from the source (`purple`), never from
 * the declaration; a literal control call in the same file proves both calls
 * extract, and the sheet carries the class with zero diagnostics.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import {
  getWantsForProp,
  hasWant,
  layerClassNames,
  type AtomicCaseSpec,
} from '../../harness/helpers.js'

const SYSTEM = '@reference-ui/lib'
const CLASS = `${SYSTEM}__c_purple`
// App.tsx lines: `branded` (imported `brand`) on 6, the literal control on 8.
const BRANDED_LINE = 6
const CONTROL_LINE = 8

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-91',
  verify(result) {
    // Both calls extract as one color want each. Without the source-first
    // root, `branded` drops silently: no want, no class, no diagnostic.
    const colors = getWantsForProp(result, 'color')
    expect(colors).toHaveLength(2)
    expect(colors.filter(w => w.line === BRANDED_LINE)).toHaveLength(1)
    expect(colors.filter(w => w.line === CONTROL_LINE)).toHaveLength(1)
    expect(hasWant(result, 'color', 'purple')).toBe(true)

    // The imported value folds to `purple`; the control shares its leaf, so
    // one runtime plan names the one emitted class.
    const plans = result.stylePlans ?? []
    expect(plans).toHaveLength(1)
    expect(plans[0]!.declarations.map(d => d.className)).toContain(CLASS)
    expect(layerClassNames(result.stylesheet, 'utilities')).toContain(CLASS)
    expect(result.stylesheet).toContain('color: purple;')

    // The runtime index resolves the leaf to its class.
    const index = createStylePlanIndex(plans)
    const merged = mergeStylePlans(index, [
      { system: SYSTEM, prop: 'color', value: 'purple' },
    ])
    expect(merged).toContain(CLASS)

    // The declaration never reaches the value walk, so nothing warns.
    expect(result.diagnostics ?? []).toHaveLength(0)
  },
}

export default spec
