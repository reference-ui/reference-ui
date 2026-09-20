/**
 * Artifact-shape station (ATM-SEAM-06). The shipped runtime artifact carries
 * no per-atom row: schema 2, no stylePlans key, and the namer tables — the
 * closed data both namers read — in its place. The compile-internal stylePlans
 * on the result still equal the pre-cutover rows, so the compiler namer stays
 * the oracle behind the differential gate.
 */
import { expect } from 'vitest'
import type { AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SEAM-06',
  verify(result) {
    // Oracle half (green): the surfaced plans equal the artifact rows.
    expect(result.stylePlans.length).toBeGreaterThan(0)
    expect(result.stylePlans).toEqual(result.runtime.stylePlans)

    // Shipped half (red until the cutover): schema 2, no per-atom key.
    expect(result.runtime.schemaVersion).toBe(2)
    expect('stylePlans' in result.runtime).toBe(false)

    // Namer tables: the closed data both namers read.
    const runtime = result.runtime as unknown as Record<string, unknown>
    const namer = runtime['namer'] as Record<string, unknown> | undefined
    expect(namer, 'runtime carries the namer tables').toBeDefined()
    expect(typeof namer!['rulesVersion']).toBe('number')
    for (const table of ['aliases', 'prefixes', 'lowerings', 'keywords', 'fonts']) {
      expect(typeof namer![table]).toBe('object')
    }
    expect(Array.isArray(namer!['weightKeywords'])).toBe(true)
    for (const table of ['colorProps', 'breakpoints', 'conditions']) {
      expect(Array.isArray(namer![table])).toBe(true)
    }
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
