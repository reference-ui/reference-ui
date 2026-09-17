/**
 * Condition-prefix class-name station. `_hover` and `_dark`+_hover` become
 * `hover:` / `dark:hover:` prefixes on the runtime class string.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-NAME-02',
  verify(result) {
    expect(result.css?.classes?.['_hover:bg:n300']).toBe(
      'condition-prefix__hover:bg_n300'
    )
    expect(result.css?.classes?.['_dark:_hover:bg:n300']).toBe(
      'condition-prefix__dark:hover:bg_n300'
    )
  },
}

export default spec
