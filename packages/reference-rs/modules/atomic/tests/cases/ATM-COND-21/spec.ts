/**
 * Bare-at-rule station (ATM-COND-21, RS-29). A queryless `@supports` (or
 * `@media`, `@container`) key is not a wrap: the want is refused with a
 * diagnostic and nothing prints. The queried form is the control.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-21',
  verify(result) {
    expect(hasWant(result, 'color', 'red.500', ['@supports'])).toBe(true)
    expect(hasWant(result, 'color', 'red.500', ['@media'])).toBe(true)

    const sheet = result.stylesheet
    expect(sheet).not.toContain('@supports {')
    expect(sheet).not.toContain('@media {')
    expect(sheet).toContain('@supports (display: grid) {')
    expect(sheet).toContain('color: var(--colors-blue-500);')
    expect(result.css?.classes).toEqual({
      '@supports (display: grid):color:blue.500': `${SYSTEM}__[@supports_(display:_grid)]:c_blue.500`,
    })

    expect(result.diagnostics.map(d => d.message).sort()).toEqual([
      'Unknown condition "@media"',
      'Unknown condition "@supports"',
    ])
  },
}

export default spec
