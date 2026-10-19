/**
 * Member-form collection (ATM-SITE-87). Compound assignments
 * (`Tabs.Panel = TabPanel`) mint dotted hosts, so member-form use sites
 * collect: inline literals and const spreads alike. `Tabs.List` is the
 * concatenation-coincidence control (it collected even before dotted
 * hosts), and `Tabs.Plain` is the alias-to-untraced negative that mints no
 * host; its use site lowers under own (styling plan S3).
 */
import { expect } from 'vitest'
import {
  getWantsForProp,
  hasWant,
  type AtomicCaseSpec,
} from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-87',
  verify(result) {
    expect(result.tracedJsxHosts ?? []).toEqual([
      'Tab',
      'TabPanel',
      'Tabs.List',
      'Tabs.Panel',
      'Tabs.Tab',
      'TabsList',
    ])
    // Direct-form control plus inline and const-spread member forms.
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'mt', '3r')).toBe(true)
    expect(hasWant(result, 'mt', '7r')).toBe(true)
    expect(hasWant(result, 'py', '5r')).toBe(true)
    expect(hasWant(result, 'pb', '3.5r')).toBe(true)
    expect(hasWant(result, 'mb', '-1px')).toBe(true)
    // List-coincidence control still collects.
    expect(hasWant(result, 'mt', '5r')).toBe(true)
    // Alias-to-untraced negative: Tabs.Plain mints no host; its site is still a
    // capitalized non-host tag nobody traces, so its prop lowers under own.
    expect(hasWant(result, 'mt', '11r')).toBe(true)
    expect(getWantsForProp(result, 'mt')).toHaveLength(5)
    expect(result.wants ?? []).toHaveLength(8)
    expect(result.stylesheet).toContain('mt_3r')
    expect(result.stylesheet).toContain('mt_7r')
    expect(result.stylesheet).toContain('py_5r')
    expect(result.stylesheet).toContain('mt_5r')
    expect(result.stylesheet).toContain('mt_11r')
    expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([])
    expect(result.diagnostics ?? []).toHaveLength(0)
    expect(Object.keys(result.css?.classes ?? {})).toHaveLength(8)
  },
}

export default spec
