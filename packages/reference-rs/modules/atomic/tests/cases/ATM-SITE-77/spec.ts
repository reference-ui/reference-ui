/**
 * Imported-conditional station (ATM-SITE-77, Overmatch Ph3 fold-side of
 * SPEC-V2-55). Branching leaves in const-object inits fan out on spread
 * and member read, imported and same-file alike; props with no static
 * value diagnose with the prop named.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const EXPECTED_WANTS: Array<{ prop: string; value: string }> = [
  { prop: 'color', value: 'red' },
  { prop: 'color', value: 'blue' },
  { prop: 'color', value: 'cyan' },
  { prop: 'color', value: 'magenta' },
  { prop: 'color', value: 'plum' },
  { prop: 'padding', value: '4px' },
  { prop: 'color', value: 'white' },
]

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-77',
  verify(result) {
    for (const { prop, value } of EXPECTED_WANTS) {
      expect(hasWant(result, prop, value)).toBe(true)
    }
    // Spread and member twins arrive twice each (imported + same-file,
    // branch + member); the static padding sibling and the partial white
    // arm arrive once per position.
    expect(result.wants ?? []).toHaveLength(12)

    // One runtime plan per unique leaf.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(EXPECTED_WANTS.length)
    for (const { prop, value } of EXPECTED_WANTS) {
      expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
    }

    // The dynamic prop and the both-dynamic prop diagnose; static
    // siblings and the partial white arm survive.
    const diagnostics = result.diagnostics ?? []
    expect(diagnostics).toHaveLength(2)
    // Documented remainder (tail crew verified): the partial prop's dropped
    // `run()` arm stays silent — the collector records only the white leaf,
    // bit-identical to a fully-static entry, so the use site cannot see the
    // loss. Diagnosing it needs a new collect-time residue channel (a
    // dropped-dynamic flag on the recorded entry, threaded through both
    // collectors and every use site), which is Ph4 scope. Pinned: no
    // diagnostic may mention the partial object.
    expect(diagnostics.some(d => d.message.includes("'part'"))).toBe(false)
    for (const expected of [
      { line: 21, message: "property 'color' of 'dyn' has no static style value" },
      { line: 24, message: "property 'color' of 'both' has no static style value" },
    ]) {
      const match = diagnostics.find(
        d => d.file?.endsWith('app.ts') && d.line === expected.line && d.message === expected.message,
      )
      expect(match, `missing app.ts:${expected.line} ${expected.message}`).toBeDefined()
      expect(match!.severity).toBe('warning')
      expect(match!.code).toBe('ATM-W-UNFOLDABLE-OBJECT-PROP')
      expect(match!.column).toBeDefined()
    }

    expect(result.stylesheet).toContain('color: red;')
    expect(result.stylesheet).toContain('color: blue;')
    expect(result.stylesheet).toContain('color: cyan;')
    expect(result.stylesheet).toContain('color: magenta;')
    expect(result.stylesheet).toContain('padding: 4px;')
  },
}

export default spec
