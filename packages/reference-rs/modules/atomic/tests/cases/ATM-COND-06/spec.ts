/**
 * Runtime-owned prop station. `variant` / `colorMode` stay off the
 * stylesheet. Sibling `mt` still emits a utility.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-06',
  verify(result) {
    expect(hasWant(result, 'variant', 'primary')).toBe(true)
    expect(hasWant(result, 'colorMode', 'dark')).toBe(true)
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    const classes = result.css?.classes ?? {}
    expect(Object.keys(classes).some(k => k.startsWith('variant:'))).toBe(false)
    expect(Object.keys(classes).some(k => k.startsWith('colorMode:'))).toBe(false)
    expect(result.stylesheet).toContain('.mt_2r')
    expect(result.stylesheet).not.toContain('variant')
    expect(result.stylesheet).not.toContain('color-mode')
    expect(result.stylesheet).not.toContain('colorMode')
  },
}

export default spec
