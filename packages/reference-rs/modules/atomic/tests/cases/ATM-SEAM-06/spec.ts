/**
 * Artifact-shape station (ATM-SEAM-06). The shipped runtime artifact carries
 * no per-atom row: schema 2, no stylePlans key, and the namer tables — the
 * closed data both namers read — in its place. The compile-internal stylePlans
 * on the result still carry the compiler rows, so the compiler namer stays
 * the oracle behind the differential gate. The shipped assertions compile
 * with the temporary passthrough disabled; the default compile keeps the
 * rows until the runtime stops indexing them.
 */
import { expect } from 'vitest'
import { compileCase, type AtomicCaseSpec } from '../../helpers.js'

function sorted(names: string[]): string[] {
  return [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}

const spec: AtomicCaseSpec = {
  id: 'ATM-SEAM-06',
  async verify(result, context) {
    // Oracle half (green): the surfaced plans are the compiler rows.
    expect(result.stylePlans.length).toBeGreaterThan(0)

    // Shipped half: schema 2 without the passthrough carries no per-atom key,
    // and the plans are identical with the rows on or off.
    const shipped = await compileCase(context.caseName, { stylePlansPassthrough: false })
    expect(shipped.stylePlans).toEqual(result.stylePlans)
    expect(shipped.runtime.schemaVersion).toBe(2)
    expect('stylePlans' in shipped.runtime).toBe(false)

    // Namer tables: the closed data both namers read.
    const namer = shipped.runtime.namer
    expect(namer, 'runtime carries the namer tables').toBeDefined()
    expect(typeof namer!.rulesVersion).toBe('number')
    for (const table of ['aliases', 'prefixes', 'lowerings', 'keywords', 'fonts'] as const) {
      expect(typeof namer![table]).toBe('object')
    }
    expect(Array.isArray(namer!.weightKeywords)).toBe(true)
    for (const table of ['colorProps', 'breakpoints', 'conditions'] as const) {
      expect(Array.isArray(namer![table])).toBe(true)
    }

    // Lookups sort their keys; the scale keeps its order with base first.
    for (const table of ['aliases', 'prefixes', 'lowerings'] as const) {
      const keys = Object.keys(namer![table] as Record<string, unknown>)
      expect(keys, `${table} keys sort`).toEqual(sorted(keys))
    }
    expect(namer!.conditions).toEqual(sorted(namer!.conditions))
    for (const [set, names] of Object.entries(namer!.keywords)) {
      expect(names, `keywords.${set} sorts`).toEqual(sorted(names))
    }
    expect(namer!.breakpoints[0]).toBe('base')
    expect(shipped.diagnostics).toEqual([])
  },
}

export default spec
