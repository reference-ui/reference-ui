/**
 * Surface-parity station (ATM-DIAG-12, Error Correct Slice 2, red shell).
 * Imported css() and traced JSX predict the same expected lookup key for
 * equivalent declarations; native `style` and `globalCss` predict none.
 * RED: no independent diagnostics analysis and no opt-in compiler channel
 * exist yet, so the channel assertions fail until Slices 2/5 land them.
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

interface ChannelDiagnostic {
  severity: string
  code: string
  message: string
  file?: string
  line?: number
  column?: number
}

/** Channel entry with source position stripped, for cross-surface equality. */
function keyShape(entry: ChannelDiagnostic): string {
  const { file: _file, line: _line, column: _column, ...rest } = entry
  return JSON.stringify(rest)
}

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-12',
  async verify(result) {
    // Both runtime surfaces collapse to one runtime key for `mt: 2r`.
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    const mtPlans = result.runtime.stylePlans.filter(
      p => p.prop === 'mt' && p.value === '2r' && p.when.length === 0
    )
    expect(mtPlans).toHaveLength(1)

    // Native `style` is not a runtime-query surface: its unique value
    // reaches neither wants nor plans.
    expect(
      (result.wants ?? []).some(
        w => w.prop === 'padding' && (w.value as { String?: string })?.String === '99px'
      )
    ).toBe(false)
    expect(
      result.runtime.stylePlans.some(p => p.prop === 'padding' && p.value === '99px')
    ).toBe(false)

    // RED HINGE: expected-key facts per surface on the opt-in channel.
    const optIn = await compileCase('ATM-DIAG-12', {
      logs: ['compiler'],
    } as unknown as Parameters<typeof compileCase>[1])
    const channel = (optIn as unknown as { compilerDiagnostics?: ChannelDiagnostic[] })
      .compilerDiagnostics
    expect(channel, 'opt-in compiler channel records expected-key facts').toBeDefined()
    const facts = channel!.filter(d => (d.file ?? '').includes('viaCss.ts'))
    const jsxFacts = channel!.filter(d => (d.file ?? '').includes('viaJsx.tsx'))
    const nativeFacts = channel!.filter(d => (d.file ?? '').includes('native.tsx'))
    // Equivalent declarations predict identical keys (modulo position).
    expect(facts.length).toBeGreaterThan(0)
    expect(jsxFacts.length).toBe(facts.length)
    expect(jsxFacts.map(keyShape).sort()).toEqual(facts.map(keyShape).sort())
    // Native `style` predicts no expected key. (`globalCss` rides the
    // base-system config, not source input; its exclusion is pinned by
    // the same channel shape plus Slice 2 unit tests.)
    expect(nativeFacts).toHaveLength(0)
  },
}

export default spec
