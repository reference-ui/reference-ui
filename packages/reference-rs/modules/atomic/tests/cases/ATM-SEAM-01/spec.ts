/**
 * Seam parity station (ATM-SEAM-01).
 * Verifies that the N-API bridge produces valid NativeRuntimeArtifact,
 * stylesheet, portableStylesheet, and diagnostics matching the native Rust contract.
 */
import { expect } from 'vitest'
import { createStylePlanIndex, mergeStylePlans } from '../../../js/index.js'
import { layerClassNames, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SEAM-01',
  verify(result) {
    // 1. Valid stylesheets
    expect(result.stylesheet).toContain('@layer')
    expect(result.stylesheet).toContain('utilities')
    expect(result.portableStylesheet).toBeDefined()
    expect(result.portableStylesheet).toContain('@layer')

    // 2. Runtime metadata
    expect(result.runtime).toBeDefined()
    expect(result.runtime.schemaVersion).toBe(2)
    expect(result.stylePlans.length).toBeGreaterThan(0)
    expect(result.runtime.stylePropNames).toContain('color')
    expect(result.runtime.stylePropNames).toContain('padding')
    expect(result.runtime.stylePropNames).not.toContain('variant')
    expect(result.runtime.stylePropNames).not.toContain('colorMode')

    // 3. Style plan resolution & last-wins merge
    const index = createStylePlanIndex(result.stylePlans)
    const merged = mergeStylePlans(index, [
      { system: '@reference-ui/lib', prop: 'color', value: 'blue.500' },
      { system: '@reference-ui/lib', prop: 'padding', value: '1r' },
    ])
    expect(merged).toContain('@reference-ui/lib__c_blue.500')
    expect(merged).toContain('@reference-ui/lib__p_1r')

    // 4. Ghost classes check: every plan class name has a matching utility in @layer utilities
    const utilities = layerClassNames(result.stylesheet, 'utilities')
    for (const plan of result.stylePlans) {
      for (const decl of plan.declarations) {
        expect(decl.className.startsWith('@reference-ui/lib__')).toBe(true)
        expect(utilities).toContain(decl.className)
      }
    }

    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
