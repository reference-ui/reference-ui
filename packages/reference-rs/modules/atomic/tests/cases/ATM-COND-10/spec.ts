/**
 * Core interaction pseudo catalog lowering: _active, _focus, _focusVisible, _disabled, _checked.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-10',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain(':is(:active, [data-active])')
    expect(sheet).toContain(':is(:focus, [data-focus])')
    expect(sheet).toContain(':is(:focus-visible, [data-focus-visible])')
    expect(sheet).toContain(
      ':is(:disabled, [disabled], [data-disabled], [aria-disabled=true])'
    )
    expect(sheet).toContain(
      ':is(:checked, [data-checked], [aria-checked=true], [data-state="checked"])'
    )
  },
}

export default spec
