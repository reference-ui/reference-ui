/**
 * Fractional rhythm station. `1/3r` and `2/3r` lower to division formulas
 * against `--spacing-root`. Class keys keep the slash.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RHYTHM-03',
  verify(result) {
    expect(result.stylesheet).toContain('padding-bottom: calc(var(--spacing-root) / 3);')
    expect(result.stylesheet).toContain('gap: calc(2 * var(--spacing-root) / 3);')
    expect(result.css?.classes?.['pb:1/3r']).toBeDefined()
    expect(result.css?.classes?.['gap:2/3r']).toBeDefined()
  },
}

export default spec
