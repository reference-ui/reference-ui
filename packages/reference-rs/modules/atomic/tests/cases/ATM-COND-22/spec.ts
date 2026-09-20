/**
 * Nested-functional station (ATM-COND-22, SPEC-V2-49). A css()-nested
 * `&:where(:has(> …, > …))` key substitutes the class inside the
 * functional arg with the child combinators, `:only-child`, and comma
 * scoping intact. Selector mirrors v2 `nested_selector_parity.rs:389`.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const WHEN = '&:where(:has(> [data-slot="icon"]:only-child, > svg:only-child))'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-22',
  verify(result) {
    expect(hasWant(result, 'paddingInline', '0', [WHEN])).toBe(true)
    expect(result.wants ?? []).toHaveLength(1)
    expect(result.stylePlans).toHaveLength(1)

    const sheet = result.stylesheet
    expect(sheet).toContain(
      ':where(:has(> [data-slot="icon"]:only-child, > svg:only-child)) {',
    )
    expect(sheet).toContain('padding-inline: 0;')
    expect(sheet).not.toMatch(/&:where/)

    expect(result.diagnostics ?? []).toHaveLength(0)
  },
}

export default spec
