/**
 * Zero-config discovery station (ATM-SITE-56). A local Card forwarding
 * StyleProps into Div extracts with jsxHosts absent and no declarations
 * on disk; tracedJsxHosts carries the discovered name. Random (bare div)
 * and Label (no style props) are not traced and stay silent.
 */
import { expect } from 'vitest'
import {
  getWantsForProp,
  hasWant,
  type AtomicCaseSpec,
} from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-56',
  verify(result) {
    expect(result.tracedJsxHosts ?? []).toEqual(['Card'])
    expect(hasWant(result, 'mt', '4r')).toBe(true)
    expect(result.wants ?? []).toHaveLength(1)
    expect(getWantsForProp(result, 'color')).toHaveLength(0)
    expect(result.stylesheet).toContain('mt_4r')
    expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([])
    // Discovery itself is silent here; the one warning is extraction's
    // rest-spread note for Card's `{...styleProps}` forwarder.
    const warnings = result.diagnostics.filter(d => d.severity === 'warning')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.message).toContain('spread')
    expect(Object.keys(result.css?.classes ?? {})).toHaveLength(1)
  },
}

export default spec
