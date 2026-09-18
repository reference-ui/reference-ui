/**
 * Stacked pseudo-compound reorder station (ATM-COND-29, SPEC-V2-80). A
 * pseudo-class stacked under a pseudo-element parent reorders before the
 * pseudo-element in the same compound. Selectors mirror v2
 * `nested_selector_parity.rs:455/:466` plus the dialect and depth arms.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-29',
  verify(result) {
    const sheet = result.stylesheet
    const count = (re: RegExp) => sheet.match(re)?.length ?? 0
    // `&::before` + `&:focus` → the class state precedes the element.
    expect(count(/:focus::before/g)).toBe(2)
    // `&::after` + `&:hover` twin.
    expect(count(/:hover::after/g)).toBe(1)
    // Dialect `_before` + `_focus` → the `:is(...)` compound moves too.
    expect(count(/:is\(:focus, \[data-focus\]\)::before/g)).toBe(1)
    // Three-level stack reorders at every depth.
    expect(count(/:hover:focus::before/g)).toBe(1)
    // Controls: element-inner stays textual; descendants keep their compound.
    expect(count(/:hover::before/g)).toBe(1)
    expect(count(/::before \.kid/g)).toBe(1)
    // No pseudo-class stranded after a pseudo-element.
    expect(sheet).not.toMatch(/::before:focus/)
    expect(sheet).not.toMatch(/::before:hover/)
    expect(sheet).not.toMatch(/::before:is\(/)
    expect(sheet).not.toMatch(/::after:hover/)
    expect(Object.keys(result.css?.classes ?? {})).toHaveLength(6)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
