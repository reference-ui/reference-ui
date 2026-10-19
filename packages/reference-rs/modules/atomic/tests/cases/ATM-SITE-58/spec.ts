/**
 * Wipe-state discovery (ATM-SITE-58). Both wrappers use
 * `PrimitiveProps`-family boundaries (the 50-wrapper lib shape) while the
 * fixture's `@reference-ui/react` self-link dangles exactly as in-sync wipe
 * (no `.reference-ui` dir); the tracer must resolve the surface-type names
 * from the engine surface. `tracedJsxHosts` carries both names, both use
 * sites extract, and the untraced bare-div antihost lowers under own
 * (styling plan S3) without a diagnostic.
 */
import { expect } from 'vitest'
import {
  compileCase,
  getWantsForProp,
  hasWant,
  type AtomicCaseSpec,
} from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-58',
  async verify(result) {
    expect(result.tracedJsxHosts ?? []).toEqual(['Badge', 'Card'])
    expect(hasWant(result, 'mt', '4r')).toBe(true)
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(result.wants ?? []).toHaveLength(3)
    expect(getWantsForProp(result, 'color')).toHaveLength(1)
    expect(result.stylesheet).toContain('mt_4r')
    expect(result.stylesheet).toContain('mt_2r')
    expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([])
    // Discovery itself is silent here; extraction's rest-spread notes for
    // Card's and Badge's `{...rest}` forwarders ride the opt-in channel; the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-58', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const warnings = (opted.compilerDiagnostics ?? []).filter(
      d => d.severity === 'warning'
    )
    expect(warnings).toHaveLength(2)
    for (const warning of warnings) {
      expect(warning.message).toContain('spread')
    }
    expect(Object.keys(result.css?.classes ?? {})).toEqual(['color:red.500', 'mt:2r', 'mt:4r'])
  },
}

export default spec
