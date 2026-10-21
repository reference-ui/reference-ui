/**
 * Trace-failure (ATM-SITE-89). Card's props type comes from an
 * unparsable file, so its style trace fails. The host trace reports that once,
 * naming Card.tsx; the unparsable types.ts reports its own parse failure; and
 * App.tsx's style-bearing Card gets the missing-graph error from extraction.
 */
import { expect } from 'vitest'
import type { AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-89',
  verify(result) {
    const traceSkips = result.diagnostics.filter(d => d.code === 'STT-W-SKIPPED-FILE')

    const cardSkips = traceSkips.filter(d => d.file?.endsWith('/src/Card.tsx'))
    expect(cardSkips, 'the host trace names the on-disk failure once').toHaveLength(1)
    expect(cardSkips[0]!.message).toContain('types.ts')
    expect(cardSkips[0]!.severity).toBe('warning')

    const typeSkips = traceSkips.filter(d => d.file?.endsWith('/src/types.ts'))
    expect(typeSkips, 'the unparsable types file reports its own failure once').toHaveLength(1)

    const missing = result.diagnostics.filter(d => d.code === 'ATM-E-MISSING-HOST-GRAPH')
    expect(missing).toHaveLength(1)
    expect(missing[0]!.file?.endsWith('/src/App.tsx')).toBe(true)
    expect(missing[0]!.message).toContain('<Card>')
  },
}

export default spec
