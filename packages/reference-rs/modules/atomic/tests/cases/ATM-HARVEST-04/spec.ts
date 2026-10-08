/**
 * Harvest control station (Forge S4-2). A static program — palette array
 * included — harvests nothing: no sinks, no harvest wants, no infos. The
 * sheet is byte-identical before and after Slice 4 (verified against the
 * pre-slice native at land time, not just against these goldens).
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-HARVEST-04',
  verify(result) {
    // Both wants are the site's; nothing carries the harvest origin.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '4px')).toBe(true)
    expect(result.wants ?? []).toHaveLength(2)
    expect((result.wants ?? []).every(w => w.origin !== 'harvest')).toBe(true)

    // No dynamic sites, no diagnostics at all — not even infos.
    expect(result.diagnostics).toEqual([])

    const classes = result.css?.classes ?? {}
    expect(Object.keys(classes).sort()).toEqual(['color:red', 'padding:4px'])

    const sheet = result.stylesheet
    expect(sheet).toContain('color: red;')
    expect(sheet).toContain('padding: 4px;')
  },
}

export default spec
