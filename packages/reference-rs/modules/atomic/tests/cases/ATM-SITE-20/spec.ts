/**
 * Unknown-prop-policy station (ATM-SITE-20, N12 + tails-d). One policy,
 * every path: unknown style keys warn and drop — `css()` literals, const
 * spreads, and `globalCss` declarations alike. No silent swallows, no
 * hyphenated dead properties.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = 'site-unknown-prop-policy'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-20',
  verify(result) {
    expect(hasWant(result, 'fooBar', 'x')).toBe(false)
    expect(hasWant(result, 'frobnicate', 'x')).toBe(false)
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'green')).toBe(true)

    const sheet = result.stylesheet
    expect(sheet).toContain('color: red;')
    expect(sheet).toContain('color: green;')
    expect(sheet).toContain('.btn:hover { color: blue }')
    expect(sheet).not.toContain('foo-bar')
    expect(sheet).not.toContain('divide-x')
    expect(sheet).not.toContain('frobnicate')
    expect(result.css?.classes).toEqual({
      'color:red': `${SYSTEM}__c_red`,
      'color:green': `${SYSTEM}__c_green`,
    })

    expect(result.diagnostics.map(d => d.message).sort()).toEqual([
      'Unknown style property "divideX"',
      'Unknown style property "fooBar"',
      'Unknown style property "frobnicate"',
      'Unknown style property in global CSS: "divideX"',
    ])
  },
}

export default spec
