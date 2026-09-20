/**
 * Factory const resolution (ATM-SITE-46, SPEC-V2-62). `keyframes()` and
 * `positionTry()` consts resolve to their declared name at consuming sites,
 * through aliases and alias chains; `viewTransition()`, non-object and
 * missing definitions, shadowed, foreign-package, and mutated factories
 * refuse with a diagnostic and keep siblings. Cleared factories clear
 * their clones too.
 */
import { expect } from 'vitest'
import { compileCase, getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-46',
  async verify(result) {
    expect(hasWant(result, 'animationName', 'spin')).toBe(true)
    expect(hasWant(result, 'animationName', 'aliased')).toBe(true)
    expect(hasWant(result, 'positionTryFallbacks', 'none')).toBe(true)
    expect(hasWant(result, 'animationName', 'early')).toBe(true)
    // Forge §5: the shadowed callee is a same-file pure arrow, so its call
    // init folds through the fence exactly like the direct call spelling.
    expect(hasWant(result, 'animationName', 'local')).toBe(true)
    expect(getWantsForProp(result, 'animationName')).toHaveLength(5)
    for (const value of ['1r', '2r', '3r', '4r', '5r', '6r', '7r', '8r']) {
      expect(hasWant(result, 'margin', value)).toBe(true)
    }
    expect(result.wants ?? []).toHaveLength(14)

    // `spin` and its alias chain share one runtime plan by lookup key.
    const plans = result.stylePlans
    expect(plans).toHaveLength(13)

    const sheet = result.stylesheet
    expect(sheet).toContain('animation-name: spin;')
    expect(sheet).toContain('animation-name: aliased;')
    expect(sheet).toContain('animation-name: early;')
    expect(sheet).toContain('animation-name: local;')
    expect(sheet).toContain('position-try-fallbacks: none;')

    // Factory refusals ride the opt-in channel now (S6 E8-class
    // re-point); the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-SITE-46', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const warnings = channel.filter(d => d.severity === 'warning')
    const infos = channel.filter(d => d.code === 'ATM-I-HARVEST-SINK')
    expect(warnings).toHaveLength(6)
    // The refused animationName position sinks with nothing compatible in
    // the pool: one zero-count info, no new wants or plans.
    expect(infos).toHaveLength(1)
    expect(infos[0]!.code).toBe('ATM-I-HARVEST-SINK')
    const codes = warnings.map(d => d.code).sort()
    expect(codes).toEqual([
      'ATM-W-DYNAMIC-IDENTIFIER',
      'ATM-W-DYNAMIC-IDENTIFIER',
      'ATM-W-DYNAMIC-IDENTIFIER',
      'ATM-W-DYNAMIC-IDENTIFIER',
      'ATM-W-DYNAMIC-IDENTIFIER',
      'ATM-W-MUTATED-BINDING',
    ])
  },
}

export default spec
