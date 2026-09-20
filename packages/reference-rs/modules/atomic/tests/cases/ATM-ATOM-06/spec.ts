/**
 * Custom-prop shape station. Scalar, array, and object `--x` forms all
 * compile as declarations; the object form mints one whole-object plan
 * with per-breakpoint declarations. Analysis predicts that same
 * whole-object lookup on the channel — never nested `base`/`md` exacts
 * under `['--x']` — and the default channel stays silent (it paints).
 */
import { expect } from 'vitest'
import { compileCase, getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-ATOM-06',
  async verify(result) {
    // All three sibling shapes mint wants; nothing warns at the gate.
    expect(hasWant(result, '--x', '1')).toBe(true)
    expect(getWantsForProp(result, '--x').length).toBeGreaterThanOrEqual(3)

    // The object form mints one whole-object plan with per-breakpoint
    // declarations — the plan the runtime query side now issues.
    const plans = result.runtime?.stylePlans ?? []
    const whole = plans.filter(
      p =>
        p.prop === '--x' &&
        p.when.length === 0 &&
        JSON.stringify(p.value) === JSON.stringify({ base: '1', md: '2' })
    )
    expect(whole).toHaveLength(1)
    const slots = (whole[0]?.declarations ?? []).map(d => d.slot).sort()
    expect(slots).toEqual(['--x@base', '--x@md'])

    // No nested plans under a `--x` when exist: nothing queries them.
    expect(plans.some(p => p.when.length === 1 && p.when[0] === '--x')).toBe(false)

    // The sheet carries the responsive declarations.
    const sheet = result.stylesheet
    expect(sheet).toContain('--x: 1;')
    expect(sheet).toContain('--x: 2;')

    // It paints, so the default channel is silent.
    expect(result.diagnostics ?? []).toEqual([])

    // The channel predicts the whole-object lookup — never nested exacts.
    const opted = await compileCase('ATM-ATOM-06', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const lookups = (opted.compilerDiagnostics ?? []).filter(
      d => d.code === 'ATM-I-EXPECTED-LOOKUP'
    )
    expect(
      lookups.some(d => d.message.includes('"--x",{"base":"1","md":"2"},false]')),
      'channel carries the whole-object lookup'
    ).toBe(true)
    expect(
      lookups.filter(d => d.message.includes('["--x"]')),
      'no nested exacts under [--x]'
    ).toHaveLength(0)
  },
}

export default spec
