/**
 * Comma-member scoping station (ATM-COND-23, SPEC-V2-68). A comma-list
 * selector key scopes every member to the parent: a member without `&`
 * is `& <member>`, and a stacked template distributes over each parent
 * member. Selectors mirror v2 `nested_selector_parity.rs:642/:653/:664`.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-23',
  verify(result) {
    const sheet = result.stylesheet
    // `&:not(:first-child), :only-child` → both members carry the same class.
    expect(sheet).toMatch(/\.(\S+?):not\(:first-child\), \.\1 :only-child/)
    // Stacked `& .left-border` distributes over both parent members.
    expect(sheet).toMatch(
      /\.(\S+?):not\(:first-child\) \.left-border, \.\1 :only-child \.left-border/,
    )
    // `& .one, .two` → the bare `.two` scopes as a descendant of the class.
    expect(sheet).toMatch(/\.(\S+) \.one, \.\1 \.two/)
    // No bare member leaks onto the document.
    expect(sheet).not.toMatch(/, :only-child/)
    expect(sheet).not.toMatch(/, \.two \{/)
    expect(Object.keys(result.css?.classes ?? {})).toHaveLength(3)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
