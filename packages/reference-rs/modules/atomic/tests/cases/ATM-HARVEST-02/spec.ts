/**
 * Harvest refusal station (Forge §2 authorship rule). `` `2${n}r` `` and
 * `` `#${hex}` `` are arithmetic, not values: they mint nothing, the sites
 * still warn `DYNAMIC-TEMPLATE`, and each refused sink infos a zero count.
 */
import { expect } from 'vitest'
import type { AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-HARVEST-02',
  verify(result) {
    // Holey templates are not information: no wants, no map entries.
    expect(result.wants ?? []).toHaveLength(0)
    expect(Object.keys(result.css?.classes ?? {})).toEqual([])

    // Each site warns at its span; each sink infos its zero count, sinks
    // ordered by (prop, when) so the pair is deterministic.
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-DYNAMIC-TEMPLATE',
      }),
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-DYNAMIC-TEMPLATE',
      }),
      expect.objectContaining({
        severity: 'info',
        code: 'ATM-I-HARVEST-SINK',
        message: 'color under []: 0 harvested values minted',
      }),
      expect.objectContaining({
        severity: 'info',
        code: 'ATM-I-HARVEST-SINK',
        message: 'margin under []: 0 harvested values minted',
      }),
    ])
  },
}

export default spec
