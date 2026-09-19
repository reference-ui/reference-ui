/**
 * Sibling-combinator station (SPEC-V2-47 utility half). `& + &` and `& ~ &`
 * authored in `css()` substitute both positions, two-level stacks apply in
 * order, and comma descendant lists scope every member.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-30',
  verify(result) {
    const sheet = result.stylesheet
    // `.c + .c` and `.c ~ .c`: both `&` positions substitute.
    expect(sheet).toContain(
      '+ .\\@reference-ui\\/lib__\\[\\&_\\+_\\&\\]\\:mt_2r { margin-top: calc(2 * var(--spacing-root)); }',
    )
    expect(sheet).toContain(
      '~ .\\@reference-ui\\/lib__\\[\\&_\\~_\\&\\]\\:mt_4r { margin-top: calc(4 * var(--spacing-root)); }',
    )
    // Two-level stack applies in order: `.c > p:hover`.
    expect(sheet).toContain('> p:hover { color: red; }')
    // Comma descendant list scopes every member.
    expect(sheet).toContain('.one, ')
    expect(sheet).toContain('.two { color: blue; }')

    expect(result.css?.classes?.['& + &:mt:2r']).toBe(
      '@reference-ui/lib__[&_+_&]:mt_2r',
    )
    expect(result.css?.classes?.['& ~ &:mt:4r']).toBe(
      '@reference-ui/lib__[&_~_&]:mt_4r',
    )
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
