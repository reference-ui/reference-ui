/**
 * `:is()` armour station (ATM-COND-24, SPEC-V2-69). Under a stacked parent
 * with a top-level combinator, a template member with multiple `&` means
 * `:is(parent)`; a single leading `&` stays textual. Mirrors v2
 * `nested_selector_parity.rs:675/:686` plus the `:hover` textual control.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-24',
  verify(result) {
    const sheet = result.stylesheet
    // `& .divider` + `& .bar & .baz` → both parents armoured.
    expect(sheet).toMatch(
      /:is\(\.(\S+) \.divider\) \.bar :is\(\.\1 \.divider\) \.baz/,
    )
    // `& > .row` + `& + &` → sibling arms compare rows, not class roots.
    expect(sheet).toMatch(/:is\(\.(\S+) > \.row\) \+ :is\(\.\1 > \.row\)/)
    // Control: single leading `&` under a complex parent stays textual.
    expect(sheet).toMatch(/\.(\S+) > p:hover/)
    // No textual double-parent substitution.
    expect(sheet).not.toMatch(/\.divider \.bar \./)
    expect(sheet).not.toMatch(/> \.row \+ \./)
    expect(Object.keys(result.css?.classes ?? {})).toHaveLength(3)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
